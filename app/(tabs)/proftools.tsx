import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Path, Svg } from "react-native-svg";
import Icon from "react-native-vector-icons/Ionicons";
import BottomNav from "../../components/BottomNav";
import { useUserProfile } from "../../context/UserProfileContext";
import { supabase } from "../../lib/supabase";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Helper formatting function
function formatDateIntervalRange(start: Date, end: Date) {
  const s = `${MONTHS[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()}`;
  const e = `${MONTHS[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  return `${s} – ${e}`;
}
function formatDateDay(date: Date) {
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(centerX, centerY, radius, endAngle);
  const end = polarToCartesian(centerX, centerY, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    `M ${centerX} ${centerY}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

interface DashboardStats {
  totalStores: number;
  activePromotions: number;
  totalViews: number;
  totalEngagements: number;
  followerViews: number;
  nonFollowerViews: number;
}

interface EngagementStats {
  visits: number;
  promotionClicks: number;
  favorites: number;
  period: '7days' | '30days';
}

interface StoreOption {
  id: string | null; // null for "All Stores"
  name: string;
}

const PRESET_PERIODS = [
  {
    label: "Last 7 Days",
    getPeriod: () => {
      const endDate = endOfDay(new Date());
      const startDate = startOfDay(new Date(endDate));
      startDate.setDate(startDate.getDate() - 6);
      return { startDate, endDate };
    },
  },
  {
    label: "Last 30 Days",
    getPeriod: () => {
      const endDate = endOfDay(new Date());
      const startDate = startOfDay(new Date(endDate));
      startDate.setDate(startDate.getDate() - 29);
      return { startDate, endDate };
    },
  },
  {
    label: "This Month",
    getPeriod: () => {
      const now = new Date();
      const startDate = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
      const endDate = endOfDay(new Date());
      return { startDate, endDate };
    },
  },
  {
    label: "Custom",
    getPeriod: null, // Will be used for activating the custom range UI
  },
];

export default function ProfessionalToolsScreen() {
  const router = useRouter();
  const { userProfile } = useUserProfile();

  // Date Filter: Default to "last 30 days"
  const defaultPeriod = PRESET_PERIODS[1].getPeriod ? PRESET_PERIODS[1].getPeriod!() : null;
  const fallbackStart = startOfDay(new Date());
  const fallbackEnd = endOfDay(new Date());
  const [startDate, setStartDate] = useState<Date>(defaultPeriod?.startDate ?? fallbackStart);
  const [endDate, setEndDate] = useState<Date>(defaultPeriod?.endDate ?? fallbackEnd);

  // For the "preset" time selector UI
  const [selectedPreset, setSelectedPreset] = useState(1); // 0 = "Last 7 Days", 1 = "Last 30 Days", etc.

  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<"start" | "end">("start");

  const [showCustomRange, setShowCustomRange] = useState(false);

  // Store selection state
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null); // null = "All Stores"
  const [showStorePicker, setShowStorePicker] = useState(false);

  // Engagement period state
  const [engagementPeriod, setEngagementPeriod] = useState<'7days' | '30days'>('7days');
  const [engagementStats, setEngagementStats] = useState<EngagementStats>({
    visits: 0,
    promotionClicks: 0,
    favorites: 0,
    period: '7days',
  });
  const [loadingEngagements, setLoadingEngagements] = useState(false);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalStores: 0,
    activePromotions: 0,
    totalViews: 0,
    totalEngagements: 0,
    followerViews: 0,
    nonFollowerViews: 0,
  });

  // Scroll limit logic
  const scrollViewRef = useRef<ScrollView | null>(null);
  const MIN_SCROLL_Y = -40;
  const lastScrollY = useRef(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    if (y < MIN_SCROLL_Y && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: MIN_SCROLL_Y, animated: false });
    }
    lastScrollY.current = y;
  };

  // Fetch user's stores on mount
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;

        if (!userId) return;

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
          // Always default to "All Stores" (total analytics)
          setSelectedStoreId(null);
        } else {
          setStores([]);
        }
      } catch (error) {
        console.error("Error fetching stores:", error);
      }
    };

    fetchStores();
  }, []);

  useEffect(() => {
    // Refetch when startDate, endDate, or selectedStoreId changes
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;

        if (!userId) {
          setLoading(false);
          return;
        }

        // Build query filters based on selected store
        const storeFilter = selectedStoreId
          ? { store_id: selectedStoreId }
          : { user_id: userId };

        // Fetch stores count (not filtered by date)
        const storesQuery = supabase
          .from("store_applications")
          .select("id")
          .eq("user_id", userId)
          .eq("status", "accepted");

        if (selectedStoreId) {
          storesQuery.eq("id", selectedStoreId);
        }

        const { data: storesData } = await storesQuery;

        // Fetch active promotions count (not filtered by date)
        const promotionsQuery = supabase
          .from("promotions")
          .select("id, expires_at, is_active, store_id")
          .eq("user_id", userId);

        if (selectedStoreId) {
          promotionsQuery.eq("store_id", selectedStoreId);
        }

        const { data: promotionsData } = await promotionsQuery;

        const activePromos = promotionsData?.filter((p) => {
          if (!p.is_active) return false;
          const expiresAt = new Date(p.expires_at);
          return expiresAt > new Date();
        }) || [];

        // Filter views and engagements by timestamp and store
        const startIso = startOfDay(startDate).toISOString();
        const endIso = endOfDay(endDate).toISOString();

        const storeIds = storesData?.map((s) => s.id) || [];

        // Use store_profile_views for views (has is_follower field)
        const profileViewsQuery = supabase
          .from("store_profile_views")
          .select("is_follower, store_id, created_at")
          .eq("store_owner_id", userId)
          .gte("created_at", startIso)
          .lte("created_at", endIso);

        if (selectedStoreId) {
          profileViewsQuery.eq("store_id", selectedStoreId);
        } else if (storeIds.length > 0) {
          profileViewsQuery.in("store_id", storeIds);
        }

        const { data: profileViewRows } = await profileViewsQuery;
        const followerViews = profileViewRows?.filter((row) => row.is_follower)?.length || 0;
        const allViews = profileViewRows?.length || 0;
        const nonFollowerViews = Math.max(allViews - followerViews, 0);

        // Get total engagements (visits + promotion clicks + favorites) from engagement_events
        const engagementsQuery = supabase
          .from("engagement_events")
          .select("engagement, store_id, created_at")
          .in("engagement", ["visit", "promotion_click", "favorite"])
          .gte("created_at", startIso)
          .lte("created_at", endIso);

        if (selectedStoreId) {
          engagementsQuery.eq("store_id", selectedStoreId);
        } else if (storeIds.length > 0) {
          engagementsQuery.in("store_id", storeIds);
        }

        const { data: engagementRows } = await engagementsQuery;
        const totalEngagements = engagementRows?.length || 0;

        setStats({
          totalStores: storesData?.length || 0,
          activePromotions: activePromos.length,
          totalViews: allViews,
          totalEngagements,
          followerViews,
          nonFollowerViews,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [startDate, endDate, selectedStoreId]);

  // Fetch engagement stats separately with 7/30 day periods
  useEffect(() => {
    const fetchEngagementStats = async () => {
      setLoadingEngagements(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;

        if (!userId) {
          setLoadingEngagements(false);
          return;
        }

        // Get store IDs to filter by
        const { data: storesData } = await supabase
          .from("store_applications")
          .select("id")
          .eq("user_id", userId)
          .eq("status", "accepted");

        const storeIds = storesData?.map((s) => s.id) || [];
        if (storeIds.length === 0) {
          setEngagementStats({ visits: 0, promotionClicks: 0, favorites: 0, period: engagementPeriod });
          setLoadingEngagements(false);
          return;
        }

        // Debug: Test query to see if we have ANY engagement data for these stores (no date filter)
        const { data: testData, error: testError } = await supabase
          .from("engagement_events")
          .select("engagement, store_id, created_at")
          .in("store_id", storeIds)
          .limit(5);
        
        console.log("Test query (no date filter) - any engagement data?", {
          hasData: (testData?.length || 0) > 0,
          count: testData?.length || 0,
          sample: testData?.slice(0, 2),
          error: testError,
        });

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
        
        console.log(`Fetching engagement stats:`, {
          period: engagementPeriod,
          startDate: startIso,
          endDate: endIso,
          selectedStoreId,
          storeIdsCount: storeIds.length,
        });

        // Build query - get all engagement events for the store owner's stores
        let query = supabase
          .from("engagement_events")
          .select("engagement, store_id, promotion_id, created_at")
          .gte("created_at", startIso)
          .lte("created_at", endIso);

        if (selectedStoreId) {
          query = query.eq("store_id", selectedStoreId);
        } else if (storeIds.length > 0) {
          query = query.in("store_id", storeIds);
        } else {
          setEngagementStats({ visits: 0, promotionClicks: 0, favorites: 0, period: engagementPeriod });
          setLoadingEngagements(false);
          return;
        }

        const { data: engagementRows, error: engagementError } = await query;

        if (engagementError) {
          console.error("Error fetching engagement events:", engagementError);
          setEngagementStats({ visits: 0, promotionClicks: 0, favorites: 0, period: engagementPeriod });
          setLoadingEngagements(false);
          return;
        }

        // Also fetch promotion clicks that might not have store_id directly
        // Query promotions table to get store_id for promotion clicks
        const promotionClickEvents = engagementRows?.filter((e) => e.engagement === 'promotion_click' && !e.store_id && e.promotion_id) || [];
        let additionalPromotionClicks: any[] = [];
        
        if (promotionClickEvents.length > 0) {
          const promotionIds = promotionClickEvents.map((e) => e.promotion_id).filter(Boolean) as string[];
          const { data: promotionsData } = await supabase
            .from("promotions")
            .select("id, store_id")
            .in("id", promotionIds);
          
          if (promotionsData) {
            // Filter promotions by store ownership
            const relevantPromotions = selectedStoreId
              ? promotionsData.filter((p) => p.store_id === selectedStoreId)
              : promotionsData.filter((p) => p.store_id && storeIds.includes(p.store_id));
            
            // Count promotion clicks for these promotions
            additionalPromotionClicks = promotionClickEvents.filter((e) => 
              relevantPromotions.some((p) => p.id === e.promotion_id)
            );
          }
        }

        // Count by engagement type
        const visits = engagementRows?.filter((e) => e.engagement === 'visit').length || 0;
        const promotionClicksFromStoreId = engagementRows?.filter((e) => e.engagement === 'promotion_click' && e.store_id).length || 0;
        const promotionClicks = promotionClicksFromStoreId + additionalPromotionClicks.length;
        const favorites = engagementRows?.filter((e) => e.engagement === 'favorite').length || 0;

        // Debug logging
        console.log(`Engagement stats for ${engagementPeriod}:`, {
          totalRows: engagementRows?.length || 0,
          dateRange: { start: startIso, end: endIso },
          storeFilter: selectedStoreId || `all ${storeIds.length} stores`,
          storeIds: selectedStoreId ? [selectedStoreId] : storeIds.slice(0, 3),
          counts: { visits, promotionClicks, favorites },
          breakdown: {
            visits: engagementRows?.filter((e) => e.engagement === 'visit').length || 0,
            promotionClicksWithStoreId: promotionClicksFromStoreId,
            promotionClicksFromPromotions: additionalPromotionClicks.length,
            favorites: engagementRows?.filter((e) => e.engagement === 'favorite').length || 0,
          },
          sampleRows: engagementRows?.slice(0, 3),
        });

        setEngagementStats({
          visits,
          promotionClicks,
          favorites,
          period: engagementPeriod,
        });
      } catch (error) {
        console.error("Error fetching engagement stats:", error);
      } finally {
        setLoadingEngagements(false);
      }
    };

    fetchEngagementStats();
  }, [engagementPeriod, selectedStoreId]);

  // Date picker logic
  const openCustomRange = () => {
    setShowCustomRange(true);
    setSelectedPreset(PRESET_PERIODS.length - 1);
  };

  const handlePresetSelect = (index: number) => {
    setSelectedPreset(index);
    if (PRESET_PERIODS[index].getPeriod) {
      const newPeriod = PRESET_PERIODS[index].getPeriod!();
      setStartDate(startOfDay(newPeriod.startDate));
      setEndDate(endOfDay(newPeriod.endDate));
      setShowCustomRange(false);
    } else {
      setShowCustomRange(true);
    }
  };

  const handleOpenDatePicker = (mode: "start" | "end") => {
    setPickerMode(mode);
    setDatePickerVisible(true);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setDatePickerVisible(false);
    if (!selectedDate) return;

    setSelectedPreset(PRESET_PERIODS.length - 1);
    setShowCustomRange(true);

    if (pickerMode === "start") {
      const normalizedStart = startOfDay(selectedDate);
      let normalizedEnd = endDate;
      if (normalizedStart > endDate) {
        normalizedEnd = endOfDay(selectedDate);
      }
      setStartDate(normalizedStart);
      setEndDate(normalizedEnd);
    } else {
      const normalizedEnd = endOfDay(selectedDate);
      let normalizedStart = startDate;
      if (normalizedEnd < startDate) {
        normalizedStart = startOfDay(selectedDate);
      }
      setStartDate(normalizedStart);
      setEndDate(normalizedEnd);
    }
  };

  const StatCard = ({
    title,
    value,
    icon,
    color,
  }: {
    title: string;
    value: number | string;
    icon: string;
    color: string;
  }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
        <Icon name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  // INSIGHT section coloring should NOT be changed for the chart
  const ViewBreakdownChart = ({
    followerViews,
    nonFollowerViews,
  }: {
    followerViews: number;
    nonFollowerViews: number;
  }) => {
    const chart = useMemo(() => {
      const dataset = [
        { key: "followers", label: "Followers", value: followerViews, color: "#d743f5" },
        { key: "nonFollowers", label: "Non-followers", value: nonFollowerViews, color: "#4c4bff" },
      ];
      const total = dataset.reduce((sum, item) => sum + item.value, 0);
      const center = 90;
      const radius = 70;

      const slices = dataset.map((item, index, arr) => {
        if (total === 0) {
          return { ...item, path: "", percentage: 0 };
        }
        const previousValue = arr.slice(0, index).reduce((sum, s) => sum + s.value, 0);
        const startAngle = (previousValue / total) * 360;
        const endAngle = ((previousValue + item.value) / total) * 360;
        return {
          ...item,
          path: describeArc(center, center, radius, startAngle, endAngle),
          percentage: Math.round((item.value / total) * 100),
        };
      });

      return { slices, total };
    }, [followerViews, nonFollowerViews]);

    if (chart.total === 0) {
      return (
        <View style={styles.chartEmptyState}>
          <Text style={styles.emptyStateText}>
            No profile views yet. Share your store to start tracking visits.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.pieChartContainer}>
        <Svg width={180} height={180} viewBox="0 0 180 180">
          {chart.slices.map(
            (slice) =>
              slice.path && (
                <Path key={slice.key} d={slice.path} fill={slice.color} stroke="#f4f4f6" strokeWidth={2} />
              )
          )}
        </Svg>
        <View style={styles.chartLegend}>
          {chart.slices.map((slice) => (
            <View key={slice.key} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.legendLabel}>{slice.label}</Text>
                <Text style={styles.legendValue}>
                  {slice.value} • {slice.percentage}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const followerPercent = stats.totalViews
    ? Math.round((stats.followerViews / stats.totalViews) * 1000) / 10
    : 0;
  const nonFollowerPercent = Math.max(0, Math.round((100 - followerPercent) * 10) / 10);

  // Replace violet colors everywhere, including the promoCards and INSIGHTS time filter, with #191820
  const promoCards = [
    {
      title: "15% OFF JUST FOR YOU",
      description: "Reward shoppers who complete their first order.",
      accent: "#00c6b7",
      background: "#e6fbf8",
    },
    {
      title: "SCAN QR CODE",
      description: "Use QR flyers to collect more followers in-store.",
      accent: "#191820",
      background: "#eef0ff",
    },
  ];

  // Lower header down by adding marginTop
  const headerMarginTop = 40;

  return (
    <View style={styles.container}>
      {datePickerVisible && (
        Platform.OS === "ios" ? (
          <Modal transparent animationType="fade" visible={datePickerVisible}>
            <Pressable style={styles.modalOverlay} onPress={() => setDatePickerVisible(false)}>
              <View />
            </Pressable>
            <View style={styles.datePickerModalContent}>
              <DateTimePicker
                value={pickerMode === "start" ? startDate : endDate}
                mode="date"
                display="spinner"
                onChange={(event, date) => {
                  if (event.type === "dismissed") return setDatePickerVisible(false);
                  handleDateChange(event, date || undefined);
                }}
                maximumDate={pickerMode === "start" ? endDate : new Date()}
                minimumDate={pickerMode === "end" ? startDate : undefined}
              />
              <TouchableOpacity
                style={styles.modalDoneButton}
                onPress={() => setDatePickerVisible(false)}
              >
                <Text style={{ fontWeight: "600", fontSize: 16 }}>Done</Text>
              </TouchableOpacity>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={pickerMode === "start" ? startDate : endDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              if (event.type === "dismissed") return setDatePickerVisible(false);
              handleDateChange(event, date || undefined);
            }}
            maximumDate={pickerMode === "start" ? endDate : new Date()}
            minimumDate={pickerMode === "end" ? startDate : undefined}
          />
        )
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#468dff" />
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <View style={{ marginTop: headerMarginTop }}>
            <Text style={styles.greetingTitle}>
              Welcome back, {userProfile?.full_name?.split(" ")[0] || "there"}!
            </Text>
            <Text style={styles.greetingSubtitle}>Track store performance at a glance.</Text>
          </View>

          {/* Store Selector - Always show if user has stores */}
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
                  size={18}
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

          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Insights</Text>
              <Text style={styles.sectionSubtitle}>Profile performance overview</Text>
            </View>
            {/* Redesigned Time Filter */}
            <View style={styles.insightsTimeToolbar}>
              <View style={styles.timeFilterPresetRow}>
                {PRESET_PERIODS.slice(0, -1).map((preset, idx) => (
                  <TouchableOpacity
                    key={preset.label}
                    style={[
                      styles.timePresetChip,
                      selectedPreset === idx && styles.timePresetChipActive,
                    ]}
                    onPress={() => handlePresetSelect(idx)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.timePresetChipText,
                        selectedPreset === idx && styles.timePresetChipTextActive,
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
                {/* Custom */}
                <TouchableOpacity
                  style={[
                    styles.timePresetChip,
                    selectedPreset === PRESET_PERIODS.length - 1 && styles.timePresetChipActive,
                  ]}
                  onPress={openCustomRange}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.timePresetChipText,
                      selectedPreset === PRESET_PERIODS.length - 1 && styles.timePresetChipTextActive,
                    ]}
                  >
                    Custom
                  </Text>
                </TouchableOpacity>
              </View>
              {showCustomRange && (
                <View style={styles.customRangePickerRow}>
                  <TouchableOpacity
                    onPress={() => handleOpenDatePicker("start")}
                    activeOpacity={0.7}
                    style={styles.timeRangeSelect}
                  >
                    <Text style={styles.timeRangeSelectText}>
                      {formatDateDay(startDate)}
                    </Text>
                    <Icon name="calendar-outline" size={16} color="#888" style={{ marginLeft: 8 }} />
                  </TouchableOpacity>
                  <Text style={styles.timeRangeSelectSeparator}>to</Text>
                  <TouchableOpacity
                    onPress={() => handleOpenDatePicker("end")}
                    activeOpacity={0.7}
                    style={styles.timeRangeSelect}
                  >
                    <Text style={styles.timeRangeSelectText}>
                      {formatDateDay(endDate)}
                    </Text>
                    <Icon name="calendar-outline" size={16} color="#888" style={{ marginLeft: 8 }} />
                  </TouchableOpacity>
                </View>
              )}
              {!showCustomRange && (
                <TouchableOpacity
                  style={styles.timeSelectedDisplayButton}
                  onPress={openCustomRange}
                  activeOpacity={0.7}
                >
                  <Text style={styles.timeSelectedDisplay}>
                    {formatDateIntervalRange(startDate, endDate)}
                  </Text>
                  <Icon name="calendar-outline" size={16} color="#565868" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.tabRow}>
            <TouchableOpacity style={[styles.tabButton, styles.tabButtonActive]}>
              <Text style={[styles.tabButtonText, styles.tabButtonTextActive]}>Profile Views</Text>
            </TouchableOpacity>
            {/* The "Followers" tab is present, but the text "Followers" next to Profile Views is NOT rendered anywhere */}
            {/* <TouchableOpacity style={styles.tabButton} activeOpacity={0.8}>
              <Text style={styles.tabButtonText}>Followers</Text>
            </TouchableOpacity> */}
          </View>

          <View style={styles.viewsCard}>
            <View style={styles.viewsHeader}>
              <View>
                <Text style={styles.viewsCount}>{stats.totalViews.toLocaleString()}</Text>
                <Text style={styles.viewsLabel}>Views</Text>
              </View>
              <View style={styles.trendChip}>
                <Icon name="arrow-up" size={16} color="#28c76f" />
                <Text style={styles.trendChipText}>
                  +{stats.totalViews.toLocaleString()}
                </Text>
              </View>
            </View>

            <ViewBreakdownChart
              followerViews={stats.followerViews}
              nonFollowerViews={stats.nonFollowerViews}
            />

            <View style={styles.percentagesRow}>
              <View style={styles.percentItem}>
                <View style={[styles.legendDot, { backgroundColor: "#d743f5" }]} />
                <Text style={styles.percentText}>{followerPercent.toFixed(1)}%</Text>
              </View>
              <View style={styles.percentItem}>
                <View style={[styles.legendDot, { backgroundColor: "#4c4bff" }]} />
                <Text style={styles.percentText}>{nonFollowerPercent.toFixed(1)}%</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={() => router.push("/(tabs)/mystore")}
          >
            <Icon name="storefront" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>My Stores</Text>
            <Icon name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>

          <View style={styles.statsContainer}>
            <StatCard
              title="Total Stores"
              value={stats.totalStores}
              icon="storefront"
              color="#468dff"
            />
            <StatCard
              title="Active Promotions"
              value={stats.activePromotions}
              icon="megaphone"
              color="#4caf50"
            />
            <StatCard
              title="Total Views"
              value={stats.totalViews}
              icon="eye"
              color="#ff9800"
            />
            <StatCard
              title="Engagements"
              value={stats.totalEngagements}
              icon="heart"
              color="#e91e63"
            />
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

            {loadingEngagements ? (
              <View style={styles.engagementLoadingContainer}>
                <ActivityIndicator size="small" color="#191820" />
              </View>
            ) : (
              <View style={styles.engagementCard}>
                <View style={styles.engagementRow}>
                  <View style={[styles.engagementIconContainer, { backgroundColor: '#468dff15' }]}>
                    <Icon name="eye-outline" size={24} color="#468dff" />
                  </View>
                  <View style={styles.engagementContent}>
                    <Text style={styles.engagementLabel}>Store Visits</Text>
                    <Text style={styles.engagementValue}>{engagementStats.visits.toLocaleString()}</Text>
                  </View>
                </View>

                <View style={styles.engagementRow}>
                  <View style={[styles.engagementIconContainer, { backgroundColor: '#4caf5015' }]}>
                    <Icon name="megaphone-outline" size={24} color="#4caf50" />
                  </View>
                  <View style={styles.engagementContent}>
                    <Text style={styles.engagementLabel}>Promotion Clicks</Text>
                    <Text style={styles.engagementValue}>{engagementStats.promotionClicks.toLocaleString()}</Text>
                  </View>
                </View>

                <View style={[styles.engagementRow, { marginBottom: 0 }]}>
                  <View style={[styles.engagementIconContainer, { backgroundColor: '#e91e6315' }]}>
                    <Icon name="heart" size={24} color="#e91e63" />
                  </View>
                  <View style={styles.engagementContent}>
                    <Text style={styles.engagementLabel}>Favorites</Text>
                    <Text style={styles.engagementValue}>{engagementStats.favorites.toLocaleString()}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Promotions</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.sectionLink}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promoScroll}>
              {promoCards.map((card, index) => (
                <View key={index} style={[styles.promoCard, { backgroundColor: card.background }]}>
                  <Text style={[styles.promoTitle, { color: card.accent }]}>{card.title}</Text>
                  <Text style={styles.promoDescription}>{card.description}</Text>
                  <TouchableOpacity activeOpacity={0.8} style={styles.promoButton}>
                    <Text style={styles.promoButtonText}>Get Started</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tips & Best Practices</Text>
            <View style={styles.tipCard}>
              <Icon name="bulb-outline" size={20} color="#ff9800" />
              <Text style={styles.tipText}>
                Create eye-catching promotions with clear images and compelling descriptions to attract more customers.
              </Text>
            </View>
            <View style={styles.tipCard}>
              <Icon name="location-outline" size={20} color="#4caf50" />
              <Text style={styles.tipText}>
                Keep your store information up to date, including accurate location and business hours.
              </Text>
            </View>
            <View style={styles.tipCard}>
              <Icon name="images-outline" size={20} color="#191820" />
              <Text style={styles.tipText}>
                Upload high-quality photos of your store to make a great first impression.
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
      <BottomNav visible />
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
  topBar: {
    display: "none",
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
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  sectionSubtitle: {
    color: "#8f92a1",
    fontSize: 13,
    marginTop: 2,
  },
  // New/adjusted "Insights" time filter toolbar
  insightsTimeToolbar: {
    alignItems: "flex-end",
    minWidth: 170,
    marginLeft: 15,
  },
  timeFilterPresetRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    marginBottom: 4,
  },
  timePresetChip: {
    backgroundColor: "#f1f2f5",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 5,
    marginBottom: 4,
  },
  timePresetChipActive: {
    backgroundColor: "#191820",
  },
  timePresetChipText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#191820",
  },
  timePresetChipTextActive: {
    color: "#fff",
    fontWeight: "800",
  },
  customRangePickerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    marginBottom: 2,
  },
  timeRangeSelect: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ece8fb",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  timeRangeSelectText: {
    fontSize: 12,
    color: "#191820",
    fontWeight: "600",
  },
  timeRangeSelectSeparator: {
    marginHorizontal: 6,
    color: "#555",
    fontSize: 12,
  },
  timeSelectedDisplay: {
    fontSize: 12,
    color: "#8f92a1",
    fontWeight: "600",
    textAlign: "right",
  },
  timeSelectedDisplayButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: "#f1f2f5",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 4,
  },
  dateChip: {
    display: "none", // old chip UI hidden for rework
  },
  dateChipText: {
    fontSize: 13,
    color: "#191820",
    fontWeight: "600",
  },
  datePickerButton: {
    backgroundColor: "#f1f2f5",
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },
  datePickerButtonText: {
    fontSize: 12,
    color: "#83818d",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#0005",
  },
  datePickerModalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    alignItems: "center",
  },
  modalDoneButton: {
    marginTop: 10,
    backgroundColor: "#eee",
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },

  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: "transparent",
    marginRight: 10,
  },
  tabButtonActive: {
    backgroundColor: "#191820",
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8f92a1",
  },
  tabButtonTextActive: {
    color: "#fff",
  },
  viewsCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ecedf2",
  },
  viewsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  viewsCount: {
    fontSize: 34,
    fontWeight: "800",
    color: "#181a20",
  },
  viewsLabel: {
    fontSize: 14,
    color: "#8f92a1",
  },
  trendChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e9f9f1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 30,
    gap: 4,
  },
  trendChipText: {
    color: "#28c76f",
    fontWeight: "700",
    fontSize: 14,
  },
  chartEmptyState: {
    marginTop: 24,
    padding: 18,
    borderRadius: 16,
    backgroundColor: "#f7f7fb",
  },
  pieChartContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  chartLegend: {
    flex: 1,
    marginLeft: 24,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 10,
  },
  legendLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#191820",
  },
  legendValue: {
    fontSize: 13,
    color: "#666",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  percentagesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },
  percentItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  percentText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#191820",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#191820",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 24,
  },
  primaryButtonText: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#191820",
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: "600",
    color: "#191820",
  },
  promoScroll: {
    paddingVertical: 4,
    paddingRight: 6,
  },
  promoCard: {
    width: 220,
    borderRadius: 18,
    padding: 18,
    marginRight: 16,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
  },
  promoDescription: {
    fontSize: 13,
    color: "#51535d",
    marginBottom: 16,
    lineHeight: 18,
  },
  promoButton: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 8,
    alignItems: "center",
  },
  promoButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#15141f",
  },
  tipCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginLeft: 12,
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
  engagementLoadingContainer: {
    padding: 20,
    alignItems: "center",
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
});
