import MapPicker from "@/components/MapPicker";
import TagSelector, { TagItem } from "@/components/TagSelector";
import { supabase } from "@/lib/supabase";
import { Buffer } from 'buffer';
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from 'expo-file-system';
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";


// Ensure Buffer is available in React Native runtime
// (user may still need to `npm install buffer` and/or configure polyfills)
global.Buffer = global.Buffer || Buffer;

export default function UploadFilesScreen() {
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(new Animated.Value(0));
  const [completed, setCompleted] = useState(false);
  const [idFiles, setIdFiles] = useState<any[]>([]);
  const [idUploading, setIdUploading] = useState(false);
  const [idProgress, setIdProgress] = useState(new Animated.Value(0));
  const [idCompleted, setIdCompleted] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [storeOwnerName, setStoreOwnerName] = useState("");
  const [streetName, setStreetName] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [landmarks, setLandmarks] = useState("");
  const [collageFiles, setCollageFiles] = useState<any[]>([]);
  const [collageUploading, setCollageUploading] = useState(false);
  const [collageProgress, setCollageProgress] = useState(new Animated.Value(0));
  const [collageCompleted, setCollageCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTags, setSelectedTags] = useState<TagItem[]>([]);
  const [licenseFiles, setLicenseFiles] = useState<any[]>([]);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);


  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/jpeg", "image/png"],
      copyToCacheDirectory: true,
    });

    if (result.assets && result.assets[0]) {
      setFile(result.assets[0]);
      setCompleted(false);
      setProgress(new Animated.Value(0));
    }
  };

  const pickIdDocuments = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/jpeg", "image/png", "application/pdf"],
      copyToCacheDirectory: true,
      multiple: true,
    });

    if (result.assets && result.assets.length > 0) {
      setIdFiles((prev) => [...prev, ...result.assets]);
      setIdCompleted(false);
      setIdProgress(new Animated.Value(0));
    }
  };

  const pickCollageDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/jpeg", "image/png"],
      copyToCacheDirectory: true,
      multiple: true,
    });

    if (result.assets && result.assets.length > 0) {
      setCollageFiles((prev) => [...prev, ...result.assets]);
      setCollageCompleted(false);
      setCollageProgress(new Animated.Value(0));
    }
  };

  const uploadFile = async () => {
    if (!file) return;
    setUploading(true);

    // Simulate upload progress (animation only)
    Animated.timing(progress, {
      toValue: 100,
      duration: 3000,
      useNativeDriver: false,
    }).start(() => {
      setUploading(false);
      setCompleted(true);
    });
  };

  const uploadId = async () => {
    if (!idFiles) return;
    setIdUploading(true);

    Animated.timing(idProgress, {
      toValue: 100,
      duration: 2500,
      useNativeDriver: false,
    }).start(() => {
      setIdUploading(false);
      setIdCompleted(true);
    });
  };

  const uploadCollage = async () => {
    if (collageFiles.length === 0) return;
    setCollageUploading(true);

    Animated.timing(collageProgress, {
      toValue: 100,
      duration: 2500,
      useNativeDriver: false,
    }).start(() => {
      setCollageUploading(false);
      setCollageCompleted(true);
    });
  };

  const progressWidth = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  const idProgressWidth = idProgress.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  const collageProgressWidth = collageProgress.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  const getExtension = (name?: string) => {
    if (!name) return "";
    const idx = name.lastIndexOf(".");
    return idx !== -1 ? name.slice(idx) : "";
  };

  const uploadToStorage = async (uri: string, storagePath: string) => {
    // Helper to infer content type from extension
    const inferType = (u: string) => {
      const l = u.toLowerCase();
      if (l.endsWith('.jpg') || l.endsWith('.jpeg')) return 'image/jpeg';
      if (l.endsWith('.png')) return 'image/png';
      if (l.endsWith('.pdf')) return 'application/pdf';
      return 'application/octet-stream';
    };
      // Primary: use Expo FileSystem to read file as base64 (reliable on Expo/React Native)
      try {
        // doc picker typically returns a file:// URI which FileSystem can read
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      const binary = Buffer.from(base64, 'base64');
      const contentType = inferType(uri);
      const { data, error } = await supabase.storage.from('tus').upload(storagePath, binary, { contentType, upsert: true });
      if (error) throw error;
      return (data as any)?.path ?? data?.path;
    } catch (e) {
      console.warn('FileSystem base64 read failed, falling back to fetch:', e);
    }

    // Fallback: try fetch -> arrayBuffer (preferred) or blob if available
    try {
      const res = await fetch(uri);
      // Prefer arrayBuffer if available
      if (typeof (res as any).arrayBuffer === 'function') {
        const arrayBuffer = await (res as any).arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);
        const contentType = inferType(uri);
        const { data, error } = await supabase.storage.from('tus').upload(storagePath, uint8, { contentType, upsert: true });
        if (error) throw error;
        return (data as any)?.path ?? data?.path;
      }

      // As a last resort try blob (may not exist in some RN runtimes)
      if (typeof (res as any).blob === 'function') {
        const blob = await (res as any).blob();
        const contentType = blob.type || inferType(uri);
        const { data, error } = await supabase.storage.from('tus').upload(storagePath, blob, { contentType, upsert: true });
        if (error) throw error;
        return (data as any)?.path ?? data?.path;
      }
    } catch (e) {
      console.warn('fetch fallback failed, no compatible fetch binary methods:', e);
    }

    // If we reach here, none of the strategies worked
    const err = new Error('No compatible method found to read the file for upload');
    console.error('All upload strategies failed:', err);
    throw err;
  };

  const uploadToStorage_fetch = async (uri: string, storagePath: string) => {
    const res = await fetch(uri);
    const blob = await res.blob();
    const l = (uri || '').toLowerCase();
    const inferFromExt = () => {
      if (l.endsWith('.jpg') || l.endsWith('.jpeg')) return 'image/jpeg';
      if (l.endsWith('.png')) return 'image/png';
      if (l.endsWith('.pdf')) return 'application/pdf';
      return 'application/octet-stream';
    };
    const contentType = blob.type || inferFromExt();
    const { data, error } = await supabase.storage.from('tus').upload(storagePath, blob, { contentType, upsert: true });
    if (error) throw error;
    return data?.path;
  }

  const uploadToStorage_FileAPI = async (uri: string, storagePath: string) => {
    // infer content type by extension
    const lower = (uri || '').toLowerCase();
    const contentType = lower.endsWith('.pdf') ? 'application/pdf'
      : (lower.endsWith('.png') ? 'image/png'
      : (lower.endsWith('.jpg') || lower.endsWith('.jpeg') ? 'image/jpeg' : 'application/octet-stream'));

    try {
      // Fetch the URI and upload the resulting Blob directly (avoids using the web File constructor
      // and the conflicting expo-file-system File type).
      const res = await fetch(uri);
      const blob = await res.blob();
      const { data, error } = await supabase.storage
        .from('tus')
        .upload(storagePath, blob, { contentType, upsert: true });

      if (error) throw error;
      return data?.path ?? (data as any)?.path;
    } catch (err) {
      console.warn('File API upload (fetch->blob) failed, falling back to base64 read', err);
      // Fallback: read via expo-file-system base64 and upload Buffer
      try {
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
        const binary = Buffer.from(base64, 'base64');
        const { data, error } = await supabase.storage.from('tus').upload(storagePath, binary, { contentType, upsert: true });
        if (error) throw error;
        return (data as any)?.path ?? data?.path;
      } catch (e) {
        console.warn('Base64 fallback failed', e);
      }
      throw err;
    }
  }

  const handleSubmitApplication = async () => {
    // Validate all required fields
    if (!storeOwnerName.trim()) {
      alert('Please enter the store owner\'s name');
      return;
    }
    if (!storeName.trim()) {
      alert('Please enter the store name');
      return;
    }
    if (!streetName.trim()) {
      alert('Please enter the street name');
      return;
    }
    if (!city.trim()) {
      alert('Please enter the city');
      return;
    }
    if (!region.trim()) {
      alert('Please enter the state/province/region');
      return;
    }
    if (!postalCode.trim()) {
      alert('Please enter the postal code');
      return;
    }
    if (!idFiles || !idCompleted) {
      alert('Please upload your Government ID');
      return;
    }
    if (!file || !completed) {
      alert('Please upload your License or Permit documents');
      return;
    }
    if (collageFiles.length === 0 || !collageCompleted) {
      alert('Please upload store photos');
      return;
    }
    if (selectedTags.length === 0) {
      alert('Please select at least one tag for your store');
      return;
    }

    try {
      setSubmitting(true);
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        alert('You must be logged in to submit.');
        return;
      }

      const userPrefix = `${user.id}`;
      let governmentIdUrls: string[] = [];
      let licenseDocsUrls: string[] = [];
      const storePhotosPaths: string[] = [];

      if (idFiles && idFiles.length > 0) {
        for (let i = 0; i < idFiles.length; i++) {
          const asset = idFiles[i];
          const ext = getExtension(asset.name || '');
          const path = await uploadToStorage(
            asset.uri,
            `applications/${userPrefix}/id_docs/${Date.now()}_id_${i}${ext || '.jpg'}`
          );
          governmentIdUrls.push(path);
        }
      }

      if (licenseFiles && licenseFiles.length > 0) {
        for (let i = 0; i < licenseFiles.length; i++) {
          const asset = licenseFiles[i];
          const ext = getExtension(asset.name || '');
          const path = await uploadToStorage(
            asset.uri,
            `applications/${userPrefix}/license_docs/${Date.now()}_license_${i}${ext || '.jpg'}`
          );
          licenseDocsUrls.push(path);
        }
      }

      for (let i = 0; i < collageFiles.length; i++) {
        const asset = collageFiles[i];
        const ext = getExtension(asset.name || '');
        const path = await uploadToStorage(asset.uri, `applications/${userPrefix}/store_photos/${Date.now()}_photo_${i}${ext || '.jpg'}`);
        storePhotosPaths.push(path);
      }

      const addressParts = [streetName, city, region, postalCode, landmarks].filter(Boolean);
      const address = addressParts.join(', ');

      const { error: insertError } = await supabase
        .from('store_applications')
        .insert([
          {
            user_id: user.id,
            full_name: storeOwnerName || null,
            store_name: storeName || null,
            address: address || null,
            tags: selectedTags.map(t => t.name),
            id_url: governmentIdUrls,
            license_url: licenseDocsUrls,
            photos_url: storePhotosPaths,
            description: description.trim() || null,
            latitude: coords?.latitude,
            longitude: coords?.longitude,
          },
        ]);

      if (insertError) throw insertError;
      alert('Application submitted successfully.');
      router.push('/(tabs)/topNavTabs/profile');
    } catch (e: any) {
      console.error('Submit error', e);
      alert(e?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 240 }}
        keyboardShouldPersistTaps="handled"
      >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/topNavTabs/profile") } style={{ padding: 8, marginLeft: -8 }}>
          <Icon name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: "600" }}></Text>
      </View>
      <View style={styles.header}>
        <Icon name="lock-closed-outline" size={20} color="#777" />
        <Text style={styles.headerText}>Store Application</Text>
      </View>
      <Text style={styles.subText}>
        Input and Upload here your Store Documents
      </Text>

      {/* Store Details */}
      <View style={styles.formCard}>
        <Text style={styles.formLabel}>Name of the Store Owner</Text>
        <TextInput
          value={storeOwnerName}
          onChangeText={setStoreOwnerName}
          placeholder="Enter store owner's full name"
          placeholderTextColor="#999"
          style={styles.input}
        />

        {/* Upload ID Box */}
        <TouchableOpacity style={styles.uploadBox} onPress={pickIdDocuments}>
          <Icon name="id-card-outline" size={30} color="#b08b00" />
          <Text style={styles.uploadText}>Upload Government ID</Text>
          <Text style={styles.uploadHint}>JPEG, PNG, or PDF up to 20 MB</Text>
          <Text style={[styles.browseText, { marginTop: 8 }]}>Browse ID</Text>
        </TouchableOpacity>
        {/* ID Upload Progress */}
        {idFiles.length > 0 && (
          <View style={styles.fileBox}>
            <View style={styles.fileInfo}>
              <Icon name="document-text-outline" size={24} color="#e74c3c" />
              <View style={{ flex: 1 }}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {idFiles.length} file(s) selected
                </Text>
              </View>
              {!idCompleted && (
                <TouchableOpacity onPress={() => setIdFiles([])}>
                  <Icon name="close" size={20} color="#777" />
                </TouchableOpacity>
              )}
            </View>

            {!idCompleted && (
              <View style={styles.progressBarContainer}>
                <Animated.View
                  style={[styles.progressBar, { width: idProgressWidth }]}
                />
              </View>
            )}

            {idCompleted && (
              <View style={styles.completedRow}>
                <Text style={styles.completedText}>ID Uploaded</Text>
                <TouchableOpacity onPress={() => setIdFiles([])}>
                  <Icon name="trash-outline" size={20} color="#333" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {idFiles.length > 0 && !idCompleted && !idUploading && (
          <TouchableOpacity style={styles.uploadBtn} onPress={uploadId}>
            <Text style={styles.uploadBtnText}>Upload ID</Text>
          </TouchableOpacity>
        )}
        {idUploading && <ActivityIndicator style={{ marginTop: 16 }} size="large" />}

        <Text style={styles.formLabel}>Name of the store</Text>
        <TextInput
          value={storeName}
          onChangeText={setStoreName}
          placeholder="Enter store name"
          placeholderTextColor="#999"
          style={styles.input}
        />

        <Text style={[styles.formLabel, { marginTop: 14 }]}>Complete Address of the Store</Text>
        <TextInput
          value={streetName}
          onChangeText={setStreetName}
          placeholder="Street Name"
          placeholderTextColor="#999"
          style={styles.input}
        />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder="City"
            placeholderTextColor="#999"
            style={[styles.input, { flex: 1 }]}
          />
          <TextInput
            value={region}
            onChangeText={setRegion}
            placeholder="State/Province/Region"
            placeholderTextColor="#999"
            style={[styles.input, { flex: 1 }]}
          />
        </View>
        <TextInput
          value={postalCode}
          onChangeText={setPostalCode}
          placeholder="Postal or ZIP Code"
          placeholderTextColor="#999"
          keyboardType="numbers-and-punctuation"
          style={styles.input}
        />

        <TextInput
          value={landmarks}
          onChangeText={setLandmarks}
          placeholder="Other landmarks (Optional)"
          placeholderTextColor="#999"
          style={styles.input}
        />
        
        <Text style={[styles.formLabel, { marginTop: 14 }]}> 
          Description of the Store (optional)
        </Text>

        <TextInput
          value={description}
          onChangeText={(text: string) => {
            // Enforce a strict 100-word limit by truncating excess words
            const words = text.trim().split(/\s+/).filter(Boolean);
            if (words.length <= 100) {
              setDescription(text);
            } else {
              setDescription(words.slice(0, 100).join(" "));
            }
          }}
          placeholder="Describe your store, its products, or special features (max 100 words)"
          placeholderTextColor="#999"
          multiline
          style={[styles.input, { height: 100, textAlignVertical: "top" }]}
        />

        <Text style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
          {description.trim().split(/\s+/).filter(Boolean).length}/200 words
        </Text>
      </View>

      {/* Upload Box */}
      <TouchableOpacity style={styles.uploadBox} onPress={pickDocument}>
        <Icon name="cloud-upload-outline" size={30} color="#b08b00" />
        <Text style={styles.uploadText}>Upload License or Permit documents of the store</Text>
        <Text style={styles.uploadHint}>JPEG, PNG, and PDF up to 50 MB</Text>
        <Text style={[styles.browseText, { marginTop: 8 }]}>Browse File</Text>
      </TouchableOpacity>

      {/* File Upload Progress */}
      {file && (
        <View style={styles.fileBox}>
          <View style={styles.fileInfo}>
            <Icon name="document-text-outline" size={24} color="#e74c3c" />
            <View style={{ flex: 1 }}>
              <Text style={styles.fileName} numberOfLines={1}>
                {file.name}
              </Text>
              <Text style={styles.fileSize}>
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </Text>
            </View>

            {!completed && (
              <TouchableOpacity onPress={() => setFile(null)}>
                <Icon name="close" size={20} color="#777" />
              </TouchableOpacity>
            )}
          </View>

          {!completed && (
            <View style={styles.progressBarContainer}>
              <Animated.View
                style={[styles.progressBar, { width: progressWidth }]}
              />
            </View>
          )}

          {completed && (
            <View style={styles.completedRow}>
              <Text style={styles.completedText}>✅ Completed</Text>
              <TouchableOpacity onPress={() => setFile(null)}>
                <Icon name="trash-outline" size={20} color="#333" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Upload Button */}
      {file && !completed && !uploading && (
        <TouchableOpacity style={styles.uploadBtn} onPress={uploadFile}>
          <Text style={styles.uploadBtnText}>Start Upload</Text>
        </TouchableOpacity>
      )}

      {uploading && <ActivityIndicator style={{ marginTop: 16 }} size="large" />}

      {/* Collage Photos of the Store */}
      <View style={{ height: 1, backgroundColor: '#eee', marginTop: 24, marginBottom: 16 }} />
      <TouchableOpacity style={styles.uploadBox} onPress={pickCollageDocument}>
        <Icon name="images-outline" size={30} color="#b08b00" />
        <Text style={styles.uploadText}>Collage photos of the store</Text>
        <Text style={styles.uploadHint}>JPEG or PNG up to 50 MB</Text>
        <Text style={[styles.browseText, { marginTop: 8 }]}>Browse Photos</Text>
      </TouchableOpacity>

      {collageFiles.length > 0 && (
        <View style={styles.fileBox}>
          <View style={styles.fileInfo}>
            <Icon name="image-outline" size={24} color="#e67e22" />
            <View style={{ flex: 1 }}>
              <Text style={styles.fileName} numberOfLines={1}>
                {collageFiles.length} photo(s) selected
              </Text>
            </View>
            {!collageCompleted && (
              <TouchableOpacity onPress={() => setCollageFiles([])}>
                <Icon name="close" size={20} color="#777" />
              </TouchableOpacity>
            )}
          </View>

          {!collageCompleted && (
            <View style={styles.progressBarContainer}>
              <Animated.View
                style={[styles.progressBar, { width: collageProgressWidth }]}
              />
            </View>
          )}

          {collageCompleted && (
            <View style={styles.completedRow}>
              <Text style={styles.completedText}>✅ Photos Uploaded</Text>
              <TouchableOpacity onPress={() => setCollageFiles([])}>
                <Icon name="trash-outline" size={20} color="#333" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {collageFiles.length > 0 && !collageCompleted && !collageUploading && (
        <TouchableOpacity style={styles.uploadBtn} onPress={uploadCollage}>
          <Text style={styles.uploadBtnText}>Upload Photos</Text>
        </TouchableOpacity>
      )}
      {collageUploading && <ActivityIndicator style={{ marginTop: 16 }} size="large" />}

      {/* Extra spacer to ensure last elements are fully scrollable on small screens */}
      <View style={{ height: 1, backgroundColor: '#eee', marginTop: 24, marginBottom: 8 }} />

      {/* Tags Section */}
      <View style={styles.formCard}>
        <TagSelector
          selectedTags={selectedTags}
          onSelect={(tag) => {
            if (!selectedTags.find((t) => t.id === tag.id)) {
              setSelectedTags([...selectedTags, tag]);
            }
          }}
          onDeselect={(tag) => {
            setSelectedTags(selectedTags.filter((t) => t.id !== tag.id));
          }}
        />
      </View>

      <Text style={{ fontWeight: "bold", marginBottom: 8 }}>Select Store Location</Text>
      <MapPicker onLocationSelect={(loc) => setCoords(loc)} />


      {/* Submit Application */}
      <TouchableOpacity
        style={[styles.uploadBtn, { backgroundColor: submitting ? '#aaa' : '#0d9488', marginTop: 16 }]}
        onPress={handleSubmitApplication}
        disabled={submitting}
      >
        <Text style={styles.uploadBtnText}>{submitting ? 'Submitting...' : 'Submit Application'}</Text>
      </TouchableOpacity>

        <View style={{ height: 160 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 60,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    padding: 14,
    marginBottom: 16,
  },
  formLabel: {
    fontWeight: "600",
    color: "#222",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#000",
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "600",
  },
  subText: {
    color: "#777",
    marginBottom: 20,
  },
  uploadBox: {
    backgroundColor: "#fffaf0",
    borderColor: "#e0c46c",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
  },
  uploadText: {
    fontWeight: "600",
    marginTop: 8,
    color: "#222",
  },
  uploadHint: {
    color: "#999",
    fontSize: 13,
    marginBottom: 10,
  },
  browseText: {
    color: "#b08b00",
    fontWeight: "600",
  },
  fileBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#eee",
  },
  fileInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  fileName: {
    fontWeight: "600",
    fontSize: 15,
  },
  fileSize: {
    color: "#999",
    fontSize: 12,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: "#f0f0f0",
    borderRadius: 3,
    marginTop: 10,
    overflow: "hidden",
  },
  progressBar: {
    height: 4,
    backgroundColor: "#e67e22",
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f2f2f2',
    borderColor: '#e0e0e0',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagPillText: {
    color: '#222',
    fontWeight: '500',
    marginRight: 4,
  },
  completedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    alignItems: "center",
  },
  completedText: {
    color: "green",
    fontWeight: "600",
  },
  uploadBtn: {
    backgroundColor: "#e67e22",
    paddingVertical: 12,
    marginTop: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  uploadBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
