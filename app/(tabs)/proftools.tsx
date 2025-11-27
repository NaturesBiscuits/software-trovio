import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import Icon from "react-native-vector-icons/Ionicons";
import BottomNav from "../../components/BottomNav";
import { supabase } from "../../lib/supabase";
import { useUserProfile } from "../../context/UserProfileContext";

interface DashboardStats {
  totalStores: number;
  activePromotions: number;
  totalViews: number;
  totalEngagements: number;
}

export default function ProfessionalToolsScreen() {
  const router = useRouter();
  const { userProfile } = useUserProfile();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalStores: 0,
    activePromotions: 0,
    totalViews: 0,
    totalEngagements: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;

        if (!userId) {
          setLoading(false);
          return;
        }

        // Fetch stores count
        const { data: storesData } = await supabase
          .from("store_applications")
          .select("id")
          .eq("user_id", userId)
          .eq("status", "accepted");

        // Fetch active promotions count
        const { data: promotionsData } = await supabase
          .from("promotions")
          .select("id, expires_at, is_active")
          .eq("user_id", userId);

        const activePromos = promotionsData?.filter((p) => {
          if (!p.is_active) return false;
          const expiresAt = new Date(p.expires_at);
          return expiresAt > new Date();
        }) || [];

        setStats({
          totalStores: storesData?.length || 0,
          activePromotions: activePromos.length,
          totalViews: 0, // Placeholder - would need analytics table
          totalEngagements: 0, // Placeholder - would need analytics table
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const quickActions = [
    {
      title: "My Stores",
      icon: "storefront-outline",
      color: "#468dff",
      onPress: () => router.push("/(tabs)/mystore"),
    },
    {
      title: "Create Promotion",
      icon: "add-circle-outline",
      color: "#4caf50",
      onPress: () => router.push("/(tabs)/mystore"),
    },
    {
      title: "Analytics",
      icon: "analytics-outline",
      color: "#ff9800",
      onPress: () => {
        // Navigate to analytics if available
      },
    },
    {
      title: "Settings",
      icon: "settings-outline",
      color: "#9c27b0",
      onPress: () => router.push("/(tabs)/settings"),
    },
  ];

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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Professional Tools</Text>
          <Text style={styles.headerSubtitle}>
            Manage your stores and track performance
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#468dff" />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome Section */}
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeTitle}>
              Welcome back, {userProfile?.full_name?.split(" ")[0] || "there"}!
            </Text>
            <Text style={styles.welcomeText}>
              Here's an overview of your professional account
            </Text>
          </View>

          {/* Statistics Cards */}
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

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.actionCard}
                  onPress={action.onPress}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.actionIconContainer,
                      { backgroundColor: `${action.color}15` },
                    ]}
                  >
                    <Icon name={action.icon} size={28} color={action.color} />
                  </View>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Insights Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Insights</Text>
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Icon name="trending-up-outline" size={20} color="#468dff" />
                <Text style={styles.insightTitle}>Performance Overview</Text>
              </View>
              <Text style={styles.insightText}>
                {stats.totalStores > 0
                  ? `You have ${stats.totalStores} store${stats.totalStores > 1 ? "s" : ""} with ${stats.activePromotions} active promotion${stats.activePromotions !== 1 ? "s" : ""}. Keep creating engaging content to reach more customers!`
                  : "Get started by creating your first store and promotion to see insights here."}
              </Text>
            </View>
          </View>

          {/* Tips Section */}
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
              <Icon name="images-outline" size={20} color="#9c27b0" />
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
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#191820",
    paddingTop: 70,
    paddingBottom: 75,
    paddingHorizontal: 25,
    borderBottomLeftRadius: 45,
    borderBottomRightRadius: 45,
    marginBottom: 15,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 8,
  },
  headerSubtitle: {
    color: "#ccc",
    fontSize: 16,
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
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  welcomeCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#468dff",
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#191820",
    marginBottom: 6,
  },
  welcomeText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    width: "48%",
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
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
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#191820",
    marginBottom: 15,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "48%",
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#191820",
    textAlign: "center",
  },
  insightCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    padding: 18,
    borderLeftWidth: 4,
    borderLeftColor: "#468dff",
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#191820",
    marginLeft: 8,
  },
  insightText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  tipCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginLeft: 12,
  },
});

