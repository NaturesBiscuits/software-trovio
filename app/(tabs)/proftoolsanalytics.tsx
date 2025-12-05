import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import Icon from "react-native-vector-icons/Ionicons";
// REMOVED: import BottomNav from "../../components/BottomNav";
import { useUserProfile } from "../../context/UserProfileContext";
import { getCurrentUser } from "../../lib/authUtils";
import { supabase } from "../../lib/supabase";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

interface StoreOption {
  id: string | null; // null for "All Stores"
  name: string;
}

interface AnalyticsStats {
  totalStores: number;
  activePromotions: number;
  visits: number;
  promotionClicks: number;
  favorites: number;
}

type PieSliceConfig = { value: number; color: string };

interface VisitBreakdownPieProps {
  slices: PieSliceConfig[];
  size?: number;
  innerRadius?: number;
}

function degreesToRadians(angle: number) {
  return (Math.PI / 180) * angle;
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angle: number) {
  const rad = degreesToRadians(angle - 90);
  return {
    x: centerX + radius * Math.cos(rad),
    y: centerY + radius * Math.sin(rad),
  };
}

function describeDonutSlice(
  centerX: number,
  centerY: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number
) {
  const arcSweep = endAngle - startAngle <= 180 ? 0 : 1;
  const startOuter = polarToCartesian(centerX, centerY, outerRadius, endAngle);
  const endOuter = polarToCartesian(centerX, centerY, outerRadius, startAngle);
  const startInner = polarToCartesian(centerX, centerY, innerRadius, endAngle);
  const endInner = polarToCartesian(centerX, centerY, innerRadius, startAngle);

  return [
    "M",
    startOuter.x,
    startOuter.y,
    "A",
    outerRadius,
    outerRadius,
    0,
    arcSweep,
    0,
    endOuter.x,
    endOuter.y,
    "L",
    endInner.x,
    endInner.y,
    "A",
    innerRadius,
    innerRadius,
    0,
    arcSweep,
    1,
    startInner.x,
    startInner.y,
    "Z",
  ].join(" ");
}

const VisitBreakdownPie = ({ slices, size = 180, innerRadius = 60 }: VisitBreakdownPieProps) => {
  const radius = size / 2;

  if (!slices.length) {
    return (
      <Svg width={size} height={size}>
        <Circle cx={radius} cy={radius} r={radius} fill="#ecedf2" />
        <Circle cx={radius} cy={radius} r={innerRadius} fill="#fff" />
      </Svg>
    );
  }

  const totalValue = slices.reduce((sum, slice) => sum + slice.value, 0);
  let startAngle = -90;

  return (
    <Svg width={size} height={size}>
      {slices.map((slice, index) => {
        if (slice.value <= 0 || totalValue === 0) {
          return null;
        }

        const sliceAngle = (slice.value / totalValue) * 360;
        const path = describeDonutSlice(radius, radius, radius, innerRadius, startAngle, startAngle + sliceAngle);
        startAngle += sliceAngle;

        return <Path key={`pie-slice-${index}`} d={path} fill={slice.color} />;
      })}
    </Svg>
  );
};

export default function ProfessionalToolsAnalyticsScreen() {
  const router = useRouter();
  const { userProfile } = useUserProfile();

  // Store selection state
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null); // null = "All Stores"
  const [showStorePicker, setShowStorePicker] = useState(false);

  // Engagement period state
  const [engagementPeriod, setEngagementPeriod] = useState<'7days' | '30days'>('7days');

  // Analytics stats
  const [stats, setStats] = useState<AnalyticsStats>({
    totalStores: 0,
    activePromotions: 0,
    visits: 0,
    promotionClicks: 0,
    favorites: 0,
  });
  const [visitBreakdown, setVisitBreakdown] = useState<{ saved: number; random: number }>({
    saved: 0,
    random: 0,
  });

  const [loading, setLoading] = useState(true);

  const totalVisitBreakdown = visitBreakdown.saved + visitBreakdown.random;
  const savedVisitPercent =
    totalVisitBreakdown > 0 ? Math.round((visitBreakdown.saved / totalVisitBreakdown) * 100) : 0;
  const randomVisitPercent = totalVisitBreakdown > 0 ? 100 - savedVisitPercent : 0;
  const pieSlices: PieSliceConfig[] = [
    {
      value: visitBreakdown.saved,
      color: "#e91e63",
    },
    {
      value: visitBreakdown.random,
      color: "#468dff",
    },
  ];
  const activePieSlices = pieSlices.filter((slice) => slice.value > 0);
  const pieDataForChart = activePieSlices.length > 0 ? activePieSlices : [{ value: 1, color: "#ecedf2" }];

  // Fetch user's stores on mount
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const { user, error: authError } = await getCurrentUser();
        const userId = user?.id;

        if (authError || !userId) return;

        const { data: storesData } = await supabase
          .from("store_applications")
          .select("id, store_name")
          .eq("user_id", userId)
          .eq("status", "accepted")
          .order("created_at", { ascending: false });

        if (storesData && storesData.length > 0) {
          const storeOptions: StoreOption[] = [
            { id: null, name: "All Stores" },
            ...storesData.map((s) => ({
              id: s.id,
              name: s.store_name || "Unnamed Store",
            })),
          ];
          setStores(storeOptions);
          setSelectedStoreId(null); // Default to "All Stores"
        } else {
          setStores([]);
        }
      } catch (error) {
        console.error("Error fetching stores:", error);
      }
    };

    fetchStores();
  }, []);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const { user, error: authError } = await getCurrentUser();
        const userId = user?.id;

        if (authError || !userId) {
          setLoading(false);
          return;
        }

        // Get store IDs for filtering
        const { data: storesData } = await supabase
          .from("store_applications")
          .select("id")
          .eq("user_id", userId)
          .eq("status", "accepted");

        const storeIds = storesData?.map((s) => s.id) || [];
        const targetStoreIds = selectedStoreId ? [selectedStoreId] : storeIds;

        // Calculate date range based on period
        const now = new Date();
        const endDate = endOfDay(now);
        const startDate = startOfDay(new Date(now));
        if (engagementPeriod === '7days') {
          startDate.setDate(startDate.getDate() - 6);
        } else {
          startDate.setDate(startDate.getDate() - 29);
        }

        const startIso = startDate.toISOString();
        const endIso = endDate.toISOString();

        // Fetch total stores count
        let storesQuery = supabase
          .from("store_applications")
          .select("id", { count: 'exact' })
          .eq("user_id", userId)
          .eq("status", "accepted");

        if (selectedStoreId) {
          storesQuery = storesQuery.eq("id", selectedStoreId);
        }

        const { count: totalStores } = await storesQuery;

        // Fetch active promotions count
        let promotionsQuery = supabase
          .from("promotions")
          .select("id", { count: 'exact' })
          .eq("user_id", userId)
          .eq("is_active", true)
          .gt("expires_at", new Date().toISOString());

        if (selectedStoreId) {
          promotionsQuery = promotionsQuery.eq("store_id", selectedStoreId);
        } else if (storeIds.length > 0) {
          promotionsQuery = promotionsQuery.in("store_id", storeIds);
        }

        const { count: activePromotions } = await promotionsQuery;

        // Fetch engagement events
        let engagementQuery = supabase
          .from("engagement_events")
          .select("engagement, store_id, promotion_id, created_at, user_id")
          .gte("created_at", startIso)
          .lte("created_at", endIso);

        if (selectedStoreId) {
          engagementQuery = engagementQuery.eq("store_id", selectedStoreId);
        } else if (targetStoreIds.length > 0) {
          engagementQuery = engagementQuery.in("store_id", targetStoreIds);
        } else {
          setStats({
            totalStores: totalStores || 0,
            activePromotions: activePromotions || 0,
            visits: 0,
            promotionClicks: 0,
            favorites: 0,
          });
          setVisitBreakdown({ saved: 0, random: 0 });
          setLoading(false);
          return;
        }

        const { data: engagementRows, error: engagementError } = await engagementQuery;

        if (engagementError) {
          console.error("Error fetching engagement events:", engagementError);
          setStats({
            totalStores: totalStores || 0,
            activePromotions: activePromotions || 0,
            visits: 0,
            promotionClicks: 0,
            favorites: 0,
          });
          setVisitBreakdown({ saved: 0, random: 0 });
          setLoading(false);
          return;
        }

        // Handle promotion clicks that might not have store_id directly
        const promotionClickEvents = engagementRows?.filter(
          (e) => e.engagement === 'promotion_click' && !e.store_id && e.promotion_id
        ) || [];

        let additionalPromotionClicks: any[] = [];

        if (promotionClickEvents.length > 0) {
          const promotionIds = promotionClickEvents.map((e) => e.promotion_id).filter(Boolean) as string[];
          const { data: promotionsData } = await supabase
            .from("promotions")
            .select("id, store_id")
            .in("id", promotionIds);

          if (promotionsData) {
            const relevantPromotions = selectedStoreId
              ? promotionsData.filter((p) => p.store_id === selectedStoreId)
              : promotionsData.filter((p) => p.store_id && storeIds.includes(p.store_id));

            additionalPromotionClicks = promotionClickEvents.filter((e) =>
              relevantPromotions.some((p) => p.id === e.promotion_id)
            );
          }
        }

        const visitRows = engagementRows?.filter((e) => e.engagement === 'visit') || [];
        let savedStoreVisits = 0;

        if (visitRows.length > 0 && targetStoreIds.length > 0) {
          // Query engagement_events table for favorites (not user_favorite_stores)
          const { data: favoriteStoreRelations } = await supabase
            .from("engagement_events")
            .select("user_id, store_id")
            .eq("engagement", "favorite")
            .in("store_id", targetStoreIds)
            .not("store_id", "is", null);

          const favoritePairs = new Set(
            (favoriteStoreRelations || [])
              .filter((relation) => relation.user_id && relation.store_id)
              .map((relation) => `${relation.user_id}_${relation.store_id}`)
          );

          if (favoritePairs.size > 0) {
            savedStoreVisits = visitRows.filter(
              (visit) =>
                visit.user_id &&
                visit.store_id &&
                favoritePairs.has(`${visit.user_id}_${visit.store_id}`)
            ).length;
          }
        }

        const visits = visitRows.length;
        const promotionClicksFromStoreId = engagementRows?.filter(
          (e) => e.engagement === 'promotion_click' && e.store_id
        ).length || 0;
        const promotionClicks = promotionClicksFromStoreId + additionalPromotionClicks.length;
        const favorites = engagementRows?.filter((e) => e.engagement === 'favorite').length || 0;
        const randomStoreVisits = Math.max(visits - savedStoreVisits, 0);

        setStats({
          totalStores: totalStores || 0,
          activePromotions: activePromotions || 0,
          visits,
          promotionClicks,
          favorites,
        });
        setVisitBreakdown({
          saved: savedStoreVisits,
          random: randomStoreVisits,
        });
      } catch (error) {
        console.error("Error fetching analytics:", error);
        setVisitBreakdown({ saved: 0, random: 0 });
      } finally {
        setLoading(false);
      }
    };

    // Only fetch analytics if we have stores loaded (or if we're checking "All Stores")
    if (stores.length > 0 || selectedStoreId === null) {
      fetchAnalytics();
    }
  }, [selectedStoreId, engagementPeriod, stores]);

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#191820" />
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Back button above header */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace("/(tabs)/discover")}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          >
            <Icon name="chevron-back" size={28} color="#181a20" />
          </TouchableOpacity>

          {/* Header placed lower */}
          <View style={styles.header}>
            <Text style={styles.greetingTitle}>Analytics</Text>
            <Text style={styles.greetingSubtitle}>
              Track your store performance and engagement metrics
            </Text>
          </View>

          {/* Store Selector */}
          {stores.length > 0 && (
            <View style={styles.storeSelectorContainer}>
              <Text style={styles.storeSelectorLabel}>Store Analytics:</Text>
              <TouchableOpacity
                style={styles.storeSelectorButton}
                onPress={() => setShowStorePicker(!showStorePicker)}
                activeOpacity={0.7}
              >
                <Text style={styles.storeSelectorText}>
                  {stores.find((s) => s.id === selectedStoreId)?.name || "All Stores"}
                </Text>
                <Icon
                  name={showStorePicker ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#191820"
                />
              </TouchableOpacity>
              {showStorePicker && (
                <>
                  <Pressable
                    style={styles.storePickerOverlay}
                    onPress={() => setShowStorePicker(false)}
                  />
                  <View style={styles.storePickerDropdown}>
                    {stores.map((store) => (
                      <TouchableOpacity
                        key={store.id || "all"}
                        style={[
                          styles.storePickerItem,
                          selectedStoreId === store.id && styles.storePickerItemActive,
                        ]}
                        onPress={() => {
                          setSelectedStoreId(store.id);
                          setShowStorePicker(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.storePickerItemText,
                            selectedStoreId === store.id && styles.storePickerItemTextActive,
                          ]}
                        >
                          {store.name}
                        </Text>
                        {selectedStoreId === store.id && (
                          <Icon name="checkmark" size={18} color="#191820" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </View>
          )}

          {/* Total Stores and Active Promotions */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#468dff15' }]}>
                <Icon name="storefront" size={24} color="#468dff" />
              </View>
              <Text style={styles.statValue}>{stats.totalStores.toLocaleString()}</Text>
              <Text style={styles.statTitle}>Total Stores</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#4caf5015' }]}>
                <Icon name="megaphone" size={24} color="#4caf50" />
              </View>
              <Text style={styles.statValue}>{stats.activePromotions.toLocaleString()}</Text>
              <Text style={styles.statTitle}>Active Promotions</Text>
            </View>
          </View>

          {/* Engagement Metrics Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Engagement Metrics</Text>
              <View style={styles.engagementPeriodButtons}>
                <TouchableOpacity
                  style={[
                    styles.engagementPeriodButton,
                    engagementPeriod === '7days' && styles.engagementPeriodButtonActive,
                  ]}
                  onPress={() => setEngagementPeriod('7days')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.engagementPeriodButtonText,
                      engagementPeriod === '7days' && styles.engagementPeriodButtonTextActive,
                    ]}
                  >
                    7 Days
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.engagementPeriodButton,
                    engagementPeriod === '30days' && styles.engagementPeriodButtonActive,
                  ]}
                  onPress={() => setEngagementPeriod('30days')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.engagementPeriodButtonText,
                      engagementPeriod === '30days' && styles.engagementPeriodButtonTextActive,
                    ]}
                  >
                    30 Days
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.engagementCard}>
              <View style={styles.engagementRow}>
                <View style={[styles.engagementIconContainer, { backgroundColor: '#468dff15' }]}>
                  <Icon name="eye-outline" size={24} color="#468dff" />
                </View>
                <View style={styles.engagementContent}>
                  <Text style={styles.engagementLabel}>Store Visits</Text>
                  <Text style={styles.engagementValue}>{stats.visits.toLocaleString()}</Text>
                </View>
              </View>

              <View style={styles.engagementRow}>
                <View style={[styles.engagementIconContainer, { backgroundColor: '#4caf5015' }]}>
                  <Icon name="megaphone-outline" size={24} color="#4caf50" />
                </View>
                <View style={styles.engagementContent}>
                  <Text style={styles.engagementLabel}>Promotion Clicks</Text>
                  <Text style={styles.engagementValue}>{stats.promotionClicks.toLocaleString()}</Text>
                </View>
              </View>

              <View style={[styles.engagementRow, { marginBottom: 0 }]}>
                <View style={[styles.engagementIconContainer, { backgroundColor: '#e91e6315' }]}>
                  <Icon name="heart" size={24} color="#e91e63" />
                </View>
                <View style={styles.engagementContent}>
                  <Text style={styles.engagementLabel}>Favorites</Text>
                  <Text style={styles.engagementValue}>{stats.favorites.toLocaleString()}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Insights Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Insights</Text>
            <Text style={styles.sectionSubtitle}>Saved fans vs. new visitors</Text>
            <View style={styles.insightsCard}>
              <View style={styles.pieChartWrapper}>
                <VisitBreakdownPie slices={pieDataForChart} size={180} innerRadius={70} />
                <View style={styles.centerLabel}>
                  <Text style={styles.centerLabelValue}>{stats.visits.toLocaleString()}</Text>
                  <Text style={styles.centerLabelCaption}>Total visits</Text>
                </View>
              </View>
              {totalVisitBreakdown > 0 ? (
                <>
                  <Text style={styles.insightsSummary}>
                    {savedVisitPercent}% of your recent visits came from shoppers who already saved your store.
                  </Text>
                  <View style={styles.insightsLegend}>
                    <View style={styles.insightsLegendRow}>
                      <View style={styles.insightsLegendLabel}>
                        <View style={[styles.legendDot, { backgroundColor: "#e91e63" }]} />
                        <View>
                          <Text style={styles.legendTitle}>Saved visitors</Text>
                          <Text style={styles.legendSubtitle}>Users who favourited you</Text>
                        </View>
                      </View>
                      <Text style={styles.legendValue}>
                        {visitBreakdown.saved.toLocaleString()} ({savedVisitPercent}%)
                      </Text>
                    </View>
                    <View style={styles.insightsLegendRow}>
                      <View style={styles.insightsLegendLabel}>
                        <View style={[styles.legendDot, { backgroundColor: "#468dff" }]} />
                        <View>
                          <Text style={styles.legendTitle}>Random visitors</Text>
                          <Text style={styles.legendSubtitle}>Organic discovery</Text>
                        </View>
                      </View>
                      <Text style={styles.legendValue}>
                        {visitBreakdown.random.toLocaleString()} ({randomVisitPercent}%)
                      </Text>
                    </View>
                  </View>
                </>
              ) : (
                <View style={styles.insightsEmptyState}>
                  <Text style={styles.insightsEmptyTitle}>No visit data yet</Text>
                  <Text style={styles.insightsEmptySubtitle}>
                    Once shoppers browse your stores we will highlight how many already saved you.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      )}
      {/* REMOVED: <BottomNav visible /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f6",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 110,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 6,
    marginBottom: 10,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  header: {
    marginBottom: 24,
    marginTop: 12,
  },
  greetingTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#181a20",
  },
  greetingSubtitle: {
    fontSize: 14,
    color: "#8f92a1",
    marginTop: 4,
  },
  storeSelectorContainer: {
    marginBottom: 20,
    position: "relative",
    zIndex: 10,
  },
  storePickerOverlay: {
    position: "absolute",
    top: 0,
    left: -20,
    right: -20,
    bottom: -1000,
    zIndex: 1,
  },
  storeSelectorLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#191820",
    marginBottom: 8,
  },
  storeSelectorButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#ecedf2",
  },
  storeSelectorText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#191820",
  },
  storePickerDropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ecedf2",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    maxHeight: 200,
    zIndex: 1000,
  },
  storePickerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f6",
  },
  storePickerItemActive: {
    backgroundColor: "#f7f7fb",
  },
  storePickerItemText: {
    fontSize: 15,
    color: "#191820",
  },
  storePickerItemTextActive: {
    fontWeight: "700",
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    width: "48%",
    marginBottom: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#191820",
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
  },
  section: {
    marginBottom: 28,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#191820",
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#8f92a1",
    marginTop: 4,
  },
  engagementPeriodButtons: {
    flexDirection: "row",
    gap: 8,
  },
  engagementPeriodButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#f1f2f5",
  },
  engagementPeriodButtonActive: {
    backgroundColor: "#191820",
  },
  engagementPeriodButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#191820",
  },
  engagementPeriodButtonTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  engagementCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#ecedf2",
  },
  engagementRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  engagementIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  engagementContent: {
    flex: 1,
  },
  engagementLabel: {
    fontSize: 14,
    color: "#8f92a1",
    marginBottom: 4,
  },
  engagementValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#191820",
  },
  insightsCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#ecedf2",
  },
  pieChartWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 180,
    height: 180,
    alignSelf: "center",
    marginBottom: 16,
  },
  centerLabel: {
    position: "absolute",
    alignItems: "center",
  },
  centerLabelValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#191820",
  },
  centerLabelCaption: {
    fontSize: 12,
    color: "#8f92a1",
    marginTop: 2,
  },
  insightsSummary: {
    fontSize: 14,
    color: "#191820",
    fontWeight: "600",
    marginBottom: 16,
  },
  insightsLegend: {
    gap: 14,
  },
  insightsLegendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  insightsLegendLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#191820",
  },
  legendSubtitle: {
    fontSize: 12,
    color: "#8f92a1",
  },
  legendValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#191820",
  },
  insightsEmptyState: {
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 8,
  },
  insightsEmptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#191820",
    marginBottom: 6,
  },
  insightsEmptySubtitle: {
    fontSize: 13,
    color: "#8f92a1",
    textAlign: "center",
    lineHeight: 18,
  },
});
