import { useUserProfile } from "@/context/UserProfileContext";
import { getCachedImageUrls } from "@/lib/imageCache";
import { supabase } from "@/lib/supabase";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import Icon from "react-native-vector-icons/Ionicons";

type StoreApplication = {
  id: string;
  user_id: string | null;
  full_name: string | null;
  store_name: string | null;
  address: string | null;
  description: string | null;
  tags: string[] | null;
  photos_url: string[] | null;
  id_url: string[] | null;
  license_url: string[] | null;
  status: string | null;
  created_at: string | null;
  latitude: number | null;
  longitude: number | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
};

type ReviewerInfo = {
  username: string | null;
  full_name: string | null;
};

export default function AdminReviewDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userProfile } = useUserProfile();
  const [application, setApplication] = useState<StoreApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [reviewerInfo, setReviewerInfo] = useState<ReviewerInfo | null>(null);
  
  // Image URLs
  const [storePhotoUrls, setStorePhotoUrls] = useState<string[]>([]);
  const [idUrls, setIdUrls] = useState<string[]>([]);
  const [licenseUrls, setLicenseUrls] = useState<string[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  
  // Modal states
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  
  // Map ref
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    const fetchApplication = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("store_applications")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          console.error("Error fetching application:", error);
          Alert.alert("Error", "Failed to load application details");
          router.back();
          return;
        }

        setApplication(data);

        // Fetch reviewer info if reviewed
        if (data.reviewed_by) {
          const { data: reviewerData } = await supabase
            .from("profiles")
            .select("username, full_name")
            .eq("id", data.reviewed_by)
            .single();
          
          if (reviewerData) {
            setReviewerInfo({
              username: reviewerData.username || null,
              full_name: reviewerData.full_name || null,
            });
          }
        }
      } catch (error) {
        console.error("Error:", error);
        Alert.alert("Error", "Failed to load application");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [id]);

  // Load all images
  useEffect(() => {
    const loadImages = async () => {
      if (!application?.user_id) {
        setLoadingImages(false);
        return;
      }

      setLoadingImages(true);
      try {
        // Load store photos
        if (application.photos_url?.length) {
          const storeUrls = await getCachedImageUrls(application.photos_url, application.user_id);
          setStorePhotoUrls(storeUrls.filter((url): url is string => Boolean(url)));
        }

        // Load government ID files
        if (application.id_url?.length) {
          const idFiles = await getCachedImageUrls(application.id_url, application.user_id);
          setIdUrls(idFiles.filter((url): url is string => Boolean(url)));
        }

        // Load license files
        if (application.license_url?.length) {
          const licenseFiles = await getCachedImageUrls(application.license_url, application.user_id);
          setLicenseUrls(licenseFiles.filter((url): url is string => Boolean(url)));
        }
      } catch (error) {
        console.error("Error loading images:", error);
      } finally {
        setLoadingImages(false);
      }
    };

    if (application) {
      loadImages();
    }
  }, [application]);

  const openPdf = async (url: string) => {
    try {
      // Check if it's a PDF by extension or content type
      const isPdf = url.toLowerCase().endsWith('.pdf') || url.includes('pdf');
      
      if (isPdf) {
        // Open PDF in browser
        await WebBrowser.openBrowserAsync(url, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        });
      } else {
        // For images, open in modal
        setSelectedImageUrl(url);
        setImageModalVisible(true);
      }
    } catch (error) {
      console.error("Error opening file:", error);
      Alert.alert("Error", "Failed to open file");
    }
  };

  const openImage = (url: string) => {
    setSelectedImageUrl(url);
    setImageModalVisible(true);
  };

  const handleAccept = async () => {
    if (!application || !userProfile?.id) return;

    Alert.alert(
      "Accept Application",
      "Are you sure you want to accept this application?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          style: "default",
          onPress: async () => {
            setProcessing(true);
            try {
              const { error } = await supabase
                .from("store_applications")
                .update({ 
                  status: "accepted",
                  reviewed_by: userProfile.id,
                  reviewed_at: new Date().toISOString(),
                })
                .eq("id", application.id);

              if (error) throw error;

              Alert.alert("Success", "Application accepted successfully", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (error: any) {
              console.error("Error accepting application:", error);
              Alert.alert("Error", error.message || "Failed to accept application");
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = async () => {
    if (!application || !userProfile?.id) return;

    Alert.alert(
      "Reject Application",
      "Are you sure you want to reject this application?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            setProcessing(true);
            try {
              const { error } = await supabase
                .from("store_applications")
                .update({ 
                  status: "declined",
                  reviewed_by: userProfile.id,
                  reviewed_at: new Date().toISOString(),
                })
                .eq("id", application.id);

              if (error) throw error;

              Alert.alert("Success", "Application rejected", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (error: any) {
              console.error("Error rejecting application:", error);
              Alert.alert("Error", error.message || "Failed to reject application");
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isPdfFile = (url: string) => {
    return url.toLowerCase().endsWith('.pdf') || url.includes('pdf');
  };

  const centerMap = () => {
    if (application?.latitude && application?.longitude && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: application.latitude,
        longitude: application.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#468dff" />
          <Text style={styles.loadingText}>Loading application...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!application) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Application not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Application</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusBadge,
              application.status === "accepted"
                ? styles.statusAccepted
                : application.status === "declined"
                ? styles.statusDeclined
                : styles.statusPending,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                application.status === "accepted" || application.status === "declined"
                  ? { color: "#fff" }
                  : { color: "#666" },
              ]}
            >
              {application.status?.toUpperCase() || "PENDING"}
            </Text>
          </View>
          {/* Reviewer Info */}
          {application.reviewed_by && reviewerInfo && (
            <View style={styles.reviewerContainer}>
              <Text style={styles.reviewerLabel}>
                Reviewed by: {reviewerInfo.username || reviewerInfo.full_name || "Admin"}
              </Text>
              {application.reviewed_at && (
                <Text style={styles.reviewerDate}>
                  {formatDate(application.reviewed_at)}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Store Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Store Information</Text>
          
          <InfoRow label="Store Name" value={application.store_name || "N/A"} />
          <InfoRow label="Owner Name" value={application.full_name || "N/A"} />
          <InfoRow label="Address" value={application.address || "N/A"} />
          <InfoRow label="Description" value={application.description || "N/A"} />
          
          {application.tags && application.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              <Text style={styles.infoLabel}>Tags:</Text>
              <View style={styles.tagsRow}>
                {application.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <InfoRow label="Submitted" value={formatDate(application.created_at)} />
        </View>

        {/* Store Photos */}
        {storePhotoUrls.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Store Photos</Text>
            {loadingImages ? (
              <ActivityIndicator size="small" color="#468dff" style={styles.loadingIndicator} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
                {storePhotoUrls.map((url, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => openImage(url)}
                    style={styles.photoContainer}
                  >
                    <Image
                      source={{ uri: url }}
                      style={styles.photo}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* Government ID */}
        {idUrls.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Government ID</Text>
            {loadingImages ? (
              <ActivityIndicator size="small" color="#468dff" style={styles.loadingIndicator} />
            ) : (
              <View style={styles.fileContainer}>
                {idUrls.map((url, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => (isPdfFile(url) ? openPdf(url) : openImage(url))}
                    style={styles.fileItem}
                  >
                    <View style={styles.fileIconContainer}>
                      {isPdfFile(url) ? (
                        <Icon name="document-text" size={32} color="#468dff" />
                      ) : (
                        <Image
                          source={{ uri: url }}
                          style={styles.fileThumbnail}
                          contentFit="cover"
                          cachePolicy="memory-disk"
                        />
                      )}
                    </View>
                    <View style={styles.fileInfo}>
                      <Text style={styles.fileName}>
                        {isPdfFile(url) ? `ID Document ${index + 1}.pdf` : `ID Image ${index + 1}`}
                      </Text>
                      <Text style={styles.fileAction}>
                        {isPdfFile(url) ? "Tap to view PDF" : "Tap to view image"}
                      </Text>
                    </View>
                    <Icon name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* License Documents */}
        {licenseUrls.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>License Documents</Text>
            {loadingImages ? (
              <ActivityIndicator size="small" color="#468dff" style={styles.loadingIndicator} />
            ) : (
              <View style={styles.fileContainer}>
                {licenseUrls.map((url, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => (isPdfFile(url) ? openPdf(url) : openImage(url))}
                    style={styles.fileItem}
                  >
                    <View style={styles.fileIconContainer}>
                      {isPdfFile(url) ? (
                        <Icon name="document-text" size={32} color="#468dff" />
                      ) : (
                        <Image
                          source={{ uri: url }}
                          style={styles.fileThumbnail}
                          contentFit="cover"
                          cachePolicy="memory-disk"
                        />
                      )}
                    </View>
                    <View style={styles.fileInfo}>
                      <Text style={styles.fileName}>
                        {isPdfFile(url) ? `License ${index + 1}.pdf` : `License Image ${index + 1}`}
                      </Text>
                      <Text style={styles.fileAction}>
                        {isPdfFile(url) ? "Tap to view PDF" : "Tap to view image"}
                      </Text>
                    </View>
                    <Icon name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Location */}
        {application.latitude && application.longitude && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.mapContainer}>
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={{
                  latitude: application.latitude,
                  longitude: application.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={true}
                zoomEnabled={true}
              >
                <Marker
                  coordinate={{
                    latitude: application.latitude,
                    longitude: application.longitude,
                  }}
                  title={application.store_name || "Store Location"}
                  description={application.address || ""}
                />
              </MapView>
              <TouchableOpacity
                style={styles.centerButton}
                onPress={centerMap}
                activeOpacity={0.8}
              >
                <Icon name="locate" size={20} color="#468dff" />
                <Text style={styles.centerButtonText}>Center</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.coordinatesContainer}>
              <Text style={styles.coordinateText}>
                {application.latitude.toFixed(6)}, {application.longitude.toFixed(6)}
              </Text>
            </View>
          </View>
        )}

        {/* Spacer for buttons */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Action Buttons */}
      {application.status !== "accepted" && application.status !== "declined" && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={handleReject}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="close-circle" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.rejectButtonText}>Reject</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={handleAccept}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="checkmark-circle" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.acceptButtonText}>Accept</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setImageModalVisible(false)}
          >
            <Icon name="close" size={30} color="#fff" />
          </TouchableOpacity>
          {selectedImageUrl && (
            <Image
              source={{ uri: selectedImageUrl }}
              style={styles.modalImage}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Helper component for info rows
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#999",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerBackButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginRight: 32,
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  statusContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  reviewerContainer: {
    marginTop: 8,
    alignItems: "center",
  },
  reviewerLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  reviewerDate: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  statusPending: {
    backgroundColor: "#f0f0f0",
  },
  statusAccepted: {
    backgroundColor: "#4caf50",
  },
  statusDeclined: {
    backgroundColor: "#f44336",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  section: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    color: "#191820",
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#191820",
    lineHeight: 22,
  },
  tagsContainer: {
    marginTop: 8,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  tag: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 13,
    color: "#1976d2",
    fontWeight: "500",
  },
  photoScroll: {
    marginTop: 12,
  },
  photoContainer: {
    marginRight: 12,
  },
  photo: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  fileContainer: {
    marginTop: 12,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  fileIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  fileThumbnail: {
    width: "100%",
    height: "100%",
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#191820",
    marginBottom: 4,
  },
  fileAction: {
    fontSize: 13,
    color: "#666",
  },
  loadingIndicator: {
    marginVertical: 20,
  },
  bottomSpacer: {
    height: 100,
  },
  actionButtons: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
  },
  acceptButton: {
    backgroundColor: "#4caf50",
  },
  rejectButton: {
    backgroundColor: "#f44336",
  },
  acceptButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  rejectButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonIcon: {
    marginRight: 8,
  },
  backButton: {
    backgroundColor: "#468dff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 8,
  },
  modalImage: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
  mapContainer: {
    height: 250,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    position: "relative",
  },
  map: {
    flex: 1,
    width: "100%",
  },
  centerButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    zIndex: 10,
  },
  centerButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#468dff",
  },
  coordinatesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  coordinateText: {
    fontSize: 13,
    color: "#666",
    fontFamily: "monospace",
    textAlign: "center",
  },
});

