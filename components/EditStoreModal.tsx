import DateTimePicker from '@react-native-community/datetimepicker';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getCachedImageUrls } from '../lib/imageCache';
import { uploadCompressedImage } from '../lib/imageUtils';
import { supabase } from '../lib/supabase';
import type { StoreApplication } from './DiscoverFlipCard';
import { type TagItem } from './TagSelector';

interface Promotion {
  id: string;
  store_id: string;
  user_id: string;
  title: string;
  description: string;
  image_url: string | null;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

interface EditStoreModalProps {
  visible: boolean;
  onClose: () => void;
  store: StoreApplication | null;
  onSuccess?: () => void;
}

export default function EditStoreModal({
  visible,
  onClose,
  store,
  onSuccess,
}: EditStoreModalProps) {
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [tags, setTags] = useState<TagItem[]>([]);
  const [tagSearch, setTagSearch] = useState('');
  const [allAvailableTags, setAllAvailableTags] = useState<TagItem[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]); // Array of photo URLs for display
  const [photoPaths, setPhotoPaths] = useState<string[]>([]); // Array of photo paths from database
  const [photoUris, setPhotoUris] = useState<string[]>([]); // Array of local URIs for new photos
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingPromotions, setLoadingPromotions] = useState(false);
  const [extendingPromoId, setExtendingPromoId] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedPromoForExtension, setSelectedPromoForExtension] = useState<Promotion | null>(null);
  const [newExpirationDate, setNewExpirationDate] = useState<Date>(new Date());

  // Initialize form data when store changes
  useEffect(() => {
    if (store && visible) {
      setStoreName(store.store_name || '');
      setDescription(store.description || '');
      setAddress(store.address || '');
      setPhotoPaths(store.photos_url || []);
      setPhotoUris([]);
      setTagSearch('');
      fetchPromotions();
      loadPhotoUrls();
      loadTags();
      loadAllAvailableTags();
    }
  }, [store, visible]);

  // Load all available tags from database
  const loadAllAvailableTags = async () => {
    setLoadingTags(true);
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading all tags:', error);
        setAllAvailableTags([]);
      } else {
        setAllAvailableTags((data as TagItem[]) || []);
      }
    } catch (error) {
      console.error('Error loading all tags:', error);
      setAllAvailableTags([]);
    } finally {
      setLoadingTags(false);
    }
  };

  // Load tags from database and convert store.tags (string[]) to TagItem[]
  const loadTags = async () => {
    if (!store?.tags || store.tags.length === 0) {
      setTags([]);
      return;
    }

    try {
      // Fetch all tags from database
      const { data: allTagsData, error } = await supabase
        .from('tags')
        .select('id, name')
        .in('name', store.tags);

      if (error) {
        console.error('Error loading tags:', error);
        // Fallback: create TagItem from names without IDs
        setTags(store.tags.map((name, index) => ({ id: index, name })));
        return;
      }

      // Map store tag names to TagItem objects
      const tagItems: TagItem[] = store.tags
        .map((tagName) => {
          const found = allTagsData?.find((t) => t.name === tagName);
          return found ? { id: found.id, name: found.name } : null;
        })
        .filter((tag): tag is TagItem => tag !== null);

      setTags(tagItems);
    } catch (error) {
      console.error('Error loading tags:', error);
      // Fallback: create TagItem from names without IDs
      setTags(store.tags.map((name, index) => ({ id: index, name })));
    }
  };

  const loadPhotoUrls = async () => {
    if (!store || !store.photos_url || !store.user_id) {
      setPhotos([]);
      setPhotoPaths([]);
      return;
    }
    try {
      // Store the original paths
      setPhotoPaths(store.photos_url);
      // Load URLs for display
      const urls = await getCachedImageUrls(store.photos_url, store.user_id);
      setPhotos(urls.filter((url): url is string => Boolean(url)));
    } catch (error) {
      console.error('Error loading photos:', error);
      setPhotoPaths(store.photos_url || []);
      setPhotos([]);
    }
  };

  const fetchPromotions = async () => {
    if (!store?.id) return;
    setLoadingPromotions(true);
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromotions((data as Promotion[]) || []);
    } catch (error) {
      console.error('Error fetching promotions:', error);
      Alert.alert('Error', 'Failed to load promotions');
    } finally {
      setLoadingPromotions(false);
    }
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need camera roll permissions to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10,
    });

    if (!result.canceled && result.assets) {
      const newUris = result.assets.map(asset => asset.uri);
      setPhotoUris([...photoUris, ...newUris]);
    }
  };

  const removePhoto = (index: number, isNewPhoto: boolean) => {
    if (isNewPhoto) {
      const newUris = [...photoUris];
      newUris.splice(index, 1);
      setPhotoUris(newUris);
    } else {
      const newPhotos = [...photos];
      const newPaths = [...photoPaths];
      newPhotos.splice(index, 1);
      newPaths.splice(index, 1);
      setPhotos(newPhotos);
      setPhotoPaths(newPaths);
    }
  };

  const handleTagSelect = (tag: TagItem) => {
    setTags([...tags, tag]);
  };

  const handleTagDeselect = (tag: TagItem) => {
    setTags(tags.filter((t) => t.id !== tag.id));
  };

  const deletePromotion = async (promoId: string) => {
    Alert.alert(
      'Delete Promotion',
      'Are you sure you want to delete this promotion?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('promotions')
                .delete()
                .eq('id', promoId);

              if (error) throw error;
              await fetchPromotions();
              Alert.alert('Success', 'Promotion deleted successfully');
            } catch (error: any) {
              console.error('Error deleting promotion:', error);
              Alert.alert('Error', error.message || 'Failed to delete promotion');
            }
          },
        },
      ]
    );
  };

  const extendPromotion = (promo: Promotion) => {
    setSelectedPromoForExtension(promo);
    const currentExpiry = new Date(promo.expires_at);
    setNewExpirationDate(currentExpiry);
    setShowDatePicker(true);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (selectedDate && event.type !== 'dismissed') {
        setNewExpirationDate(selectedDate);
        // Show confirmation with days info on Android
        if (selectedPromoForExtension) {
          const currentExpiry = new Date(selectedPromoForExtension.expires_at);
          const daysDiff = Math.floor(
            (selectedDate.getTime() - currentExpiry.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysDiff !== 0) {
            Alert.alert(
              'Date Updated',
              `Promotion will be ${daysDiff > 0 ? 'extended' : 'reduced'} by ${Math.abs(daysDiff)} day${Math.abs(daysDiff) !== 1 ? 's' : ''}.`,
              [
                { text: 'Cancel', onPress: () => setNewExpirationDate(currentExpiry), style: 'cancel' },
                { text: 'Confirm', onPress: confirmExtendPromotion },
              ]
            );
          } else {
            confirmExtendPromotion();
          }
        }
      }
      return;
    }
    if (selectedDate && event.type !== 'dismissed') {
      setNewExpirationDate(selectedDate);
    }
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
    }
  };

  const confirmExtendPromotion = async () => {
    if (!selectedPromoForExtension) return;

    if (newExpirationDate <= new Date()) {
      Alert.alert('Error', 'Expiration date must be in the future');
      return;
    }

    setExtendingPromoId(selectedPromoForExtension.id);
    try {
      const { error } = await supabase
        .from('promotions')
        .update({ expires_at: newExpirationDate.toISOString() })
        .eq('id', selectedPromoForExtension.id);

      if (error) throw error;
      await fetchPromotions();
      setShowDatePicker(false);
      setSelectedPromoForExtension(null);
      Alert.alert('Success', 'Promotion expiration extended successfully');
    } catch (error: any) {
      console.error('Error extending promotion:', error);
      Alert.alert('Error', error.message || 'Failed to extend promotion');
    } finally {
      setExtendingPromoId(null);
    }
  };

  const handleSave = async () => {
    if (!store) return;

    if (!storeName.trim()) {
      Alert.alert('Error', 'Store name is required');
      return;
    }

    setUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) {
        Alert.alert('Error', 'You must be logged in');
        return;
      }

      // Upload new photos
      const newPhotoPaths: string[] = [];
      for (const uri of photoUris) {
        try {
          const path = await uploadCompressedImage(
            uri,
            `applications/${userId}/store_photos/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`,
            'tus',
            { compress: 0.5, maxWidth: 1024 }
          );
          newPhotoPaths.push(path);
        } catch (error) {
          console.error('Error uploading photo:', error);
        }
      }

      // Combine existing photos (paths) with new photos
      // photoPaths contains the original paths from the database
      const allPhotoPaths = [...photoPaths, ...newPhotoPaths];

      // Convert TagItem[] to string[] (just the names) for database
      const tagNames = tags.map((tag) => tag.name);

      // Update store in database
      const { error } = await supabase
        .from('store_applications')
        .update({
          store_name: storeName.trim(),
          description: description.trim() || null,
          address: address.trim() || null,
          tags: tagNames.length > 0 ? tagNames : null,
          photos_url: allPhotoPaths.length > 0 ? allPhotoPaths : null,
        })
        .eq('id', store.id);

      if (error) throw error;

      Alert.alert('Success', 'Store updated successfully');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error saving store:', error);
      Alert.alert('Error', error.message || 'Failed to save store changes');
    } finally {
      setUploading(false);
    }
  };

  if (!store) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Store</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={styles.saveButton}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Store Name */}
          <View style={styles.section}>
            <Text style={styles.label}>Store Name *</Text>
            <TextInput
              style={styles.input}
              value={storeName}
              onChangeText={setStoreName}
              placeholder="Enter store name"
              placeholderTextColor="#999"
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter store description"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Address */}
          <View style={styles.section}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter store address"
              placeholderTextColor="#999"
            />
          </View>

          {/* Tags */}
          <View style={styles.section}>
            <Text style={styles.label}>Tags</Text>
            
            {/* Selected Tags Display */}
            {tags.length > 0 && (
              <View style={styles.selectedTagsContainer}>
                {tags.map((tag) => (
                  <TouchableOpacity
                    key={tag.id}
                    style={styles.selectedTag}
                    onLongPress={() => handleTagDeselect(tag)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.selectedTagText}>{tag.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Search Input */}
            <View style={styles.tagSearchContainer}>
              <View style={styles.tagSearchInputContainer}>
                <Icon name="search-outline" size={20} color="#999" style={styles.tagSearchIcon} />
                <TextInput
                  placeholder="Search tags to add..."
                  value={tagSearch}
                  onChangeText={setTagSearch}
                  style={styles.tagSearchInput}
                  placeholderTextColor="#999"
                />
                {tagSearch.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setTagSearch('')}
                    style={styles.clearSearchButton}
                  >
                    <Icon name="close-circle" size={20} color="#999" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Tag Results - Only show when searching */}
            {tagSearch.length > 0 && (
              <View style={styles.tagResultsContainer}>
                {loadingTags ? (
                  <ActivityIndicator size="small" color="#1f78ff" style={{ marginVertical: 20 }} />
                ) : (
                  <View style={styles.tagsGrid}>
                    {allAvailableTags
                      .filter((tag) =>
                        tag.name.toLowerCase().includes(tagSearch.toLowerCase()) &&
                        !tags.some((selectedTag) => selectedTag.id === tag.id)
                      )
                      .map((tag) => (
                        <TouchableOpacity
                          key={String(tag.id)}
                          onPress={() => {
                            handleTagSelect(tag);
                            setTagSearch('');
                          }}
                          style={styles.tagChip}
                        >
                          <Text style={styles.tagChipText}>{tag.name}</Text>
                          <Icon name="add" size={16} color="#9333ea" style={styles.tagIcon} />
                        </TouchableOpacity>
                      ))}
                    {allAvailableTags.filter(
                      (tag) =>
                        tag.name.toLowerCase().includes(tagSearch.toLowerCase()) &&
                        !tags.some((selectedTag) => selectedTag.id === tag.id)
                    ).length === 0 && (
                      <Text style={styles.noResultsText}>No tags found matching "{tagSearch}"</Text>
                    )}
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Photos */}
          <View style={styles.section}>
            <Text style={styles.label}>Store Photos</Text>
            <TouchableOpacity onPress={pickImages} style={styles.addPhotoButton}>
              <Icon name="camera-outline" size={24} color="#1f78ff" />
              <Text style={styles.addPhotoText}>Add Photos</Text>
            </TouchableOpacity>

            {/* Existing Photos */}
            {photos.length > 0 && (
              <View style={styles.photosContainer}>
                {photos.map((photo, index) => (
                  <View key={`existing-${index}`} style={styles.photoWrapper}>
                    <ExpoImage
                      source={{ uri: photo }}
                      style={styles.photo}
                      contentFit="cover"
                    />
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => removePhoto(index, false)}
                    >
                      <Icon name="close-circle" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* New Photos */}
            {photoUris.length > 0 && (
              <View style={styles.photosContainer}>
                {photoUris.map((uri, index) => (
                  <View key={`new-${index}`} style={styles.photoWrapper}>
                    <Image source={{ uri }} style={styles.photo} />
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => removePhoto(index, true)}
                    >
                      <Icon name="close-circle" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Promotions */}
          <View style={styles.section}>
            <Text style={styles.label}>Promotions</Text>
            {loadingPromotions ? (
              <ActivityIndicator size="small" color="#1f78ff" style={{ marginVertical: 20 }} />
            ) : promotions.length === 0 ? (
              <Text style={styles.emptyText}>No promotions</Text>
            ) : (
              promotions.map((promo) => {
                const expiresAt = new Date(promo.expires_at);
                const isExpired = expiresAt <= new Date();
                const timeRemaining = expiresAt.getTime() - Date.now();
                const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));

                return (
                  <View key={promo.id} style={styles.promotionCard}>
                    <View style={styles.promotionHeader}>
                      <Text style={styles.promotionTitle}>{promo.title}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          !promo.is_active || isExpired
                            ? styles.statusInactive
                            : styles.statusActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            !promo.is_active || isExpired
                              ? styles.statusTextInactive
                              : styles.statusTextActive,
                          ]}
                        >
                          {!promo.is_active || isExpired ? 'Expired' : 'Active'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.promotionDescription}>{promo.description}</Text>
                    <Text style={styles.promotionExpiry}>
                      {isExpired
                        ? 'Expired'
                        : daysRemaining > 0
                        ? `${daysRemaining} day${daysRemaining > 1 ? 's' : ''} left`
                        : 'Expiring soon'}
                    </Text>
                    <View style={styles.promotionActions}>
                      <TouchableOpacity
                        style={styles.extendButton}
                        onPress={() => extendPromotion(promo)}
                        disabled={extendingPromoId === promo.id}
                      >
                        {extendingPromoId === promo.id ? (
                          <ActivityIndicator size="small" color="#1f78ff" />
                        ) : (
                          <>
                            <Icon name="time-outline" size={16} color="#1f78ff" />
                            <Text style={styles.extendButtonText}>Extend</Text>
                          </>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => deletePromotion(promo.id)}
                      >
                        <Icon name="trash-outline" size={16} color="#f44336" />
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* Date Picker for Extension - Android */}
        {Platform.OS === 'android' && showDatePicker && (
          <>
            <DateTimePicker
              value={newExpirationDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          </>
        )}

        {/* Date Picker for Extension - iOS */}
        {Platform.OS === 'ios' && showDatePicker && (
          <Modal
            visible={showDatePicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowDatePicker(false)}
          >
            <View style={styles.datePickerOverlay}>
              <TouchableOpacity
                style={styles.datePickerBackdrop}
                activeOpacity={1}
                onPress={() => {
                  setShowDatePicker(false);
                  setSelectedPromoForExtension(null);
                }}
              />
              <View style={styles.datePickerContainer}>
                <ScrollView 
                  style={styles.datePickerScrollView}
                  contentContainerStyle={styles.datePickerScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.datePickerTitle}>Extend Promotion Expiration</Text>
                  
                  {selectedPromoForExtension && (
                    <View style={styles.dateInfoContainer}>
                      <View style={styles.dateInfoRow}>
                        <Text style={styles.dateInfoLabel}>Current expiration:</Text>
                        <Text style={styles.dateInfoValue}>
                          {new Date(selectedPromoForExtension.expires_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Text>
                      </View>
                      <View style={styles.dateInfoRow}>
                        <Text style={styles.dateInfoLabel}>New expiration:</Text>
                        <Text style={[styles.dateInfoValue, styles.dateInfoValueNew]}>
                          {newExpirationDate.toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Text>
                      </View>
                      {(() => {
                        const currentExpiry = new Date(selectedPromoForExtension.expires_at);
                        const daysDiff = Math.floor(
                          (newExpirationDate.getTime() - currentExpiry.getTime()) / (1000 * 60 * 60 * 24)
                        );
                        return daysDiff !== 0 ? (
                          <View style={styles.daysExtendedContainer}>
                            <Text style={styles.daysExtendedText}>
                              {daysDiff > 0 ? '+' : ''}{daysDiff} day{daysDiff !== 1 ? 's' : ''} {daysDiff > 0 ? 'extended' : 'reduced'}
                            </Text>
                          </View>
                        ) : null;
                      })()}
                    </View>
                  )}
                  
                  <View style={styles.datePickerContent}>
                    <DateTimePicker
                      value={newExpirationDate}
                      mode="date"
                      display="spinner"
                      onChange={handleDateChange}
                      minimumDate={new Date()}
                      style={styles.iosDatePicker}
                      textColor="#000"
                      themeVariant="light"
                      locale="en_US"
                    />
                  </View>
                </ScrollView>
                
                <View style={styles.datePickerActions}>
                  <TouchableOpacity
                    style={styles.datePickerCancel}
                    onPress={() => {
                      setShowDatePicker(false);
                      setSelectedPromoForExtension(null);
                    }}
                  >
                    <Text style={styles.datePickerCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.datePickerConfirm}
                    onPress={confirmExtendPromotion}
                  >
                    <Text style={styles.datePickerConfirmText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  saveButton: {
    backgroundColor: '#1f78ff',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  selectedTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9333ea',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedTagText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  tagSearchContainer: {
    marginBottom: 12,
  },
  tagSearchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  tagSearchIcon: {
    marginRight: 8,
  },
  tagSearchInput: {
    flex: 1,
    paddingVertical: 10,
    color: '#000',
    fontSize: 16,
  },
  clearSearchButton: {
    padding: 4,
  },
  tagResultsContainer: {
    marginTop: 8,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  tagChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  tagIcon: {
    marginLeft: 2,
  },
  noResultsText: {
    color: '#999',
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
    fontSize: 14,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1f78ff',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  addPhotoText: {
    color: '#1f78ff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  photoWrapper: {
    width: 100,
    height: 100,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  promotionCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  promotionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  promotionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#e8f5e9',
  },
  statusInactive: {
    backgroundColor: '#ffebee',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTextActive: {
    color: '#4caf50',
  },
  statusTextInactive: {
    color: '#f44336',
  },
  promotionDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  promotionExpiry: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  promotionActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  extendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1f78ff',
  },
  extendButtonText: {
    color: '#1f78ff',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 14,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  deleteButtonText: {
    color: '#f44336',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 14,
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    fontStyle: 'italic',
  },
  datePickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  datePickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  datePickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '80%',
  },
  datePickerScrollView: {
    maxHeight: 400,
  },
  datePickerScrollContent: {
    paddingBottom: 10,
  },
  datePickerContent: {
    height: 216,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
    backgroundColor: '#fff',
    overflow: 'visible',
  },
  iosDatePicker: {
    width: '100%',
    height: 216,
    backgroundColor: '#fff',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  dateInfoContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  dateInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateInfoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  dateInfoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  dateInfoValueNew: {
    color: '#1f78ff',
  },
  daysExtendedContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  daysExtendedText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f78ff',
    textAlign: 'center',
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  datePickerCancel: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f3f3f3',
    marginRight: 8,
    alignItems: 'center',
  },
  datePickerCancelText: {
    color: '#333',
    fontWeight: '600',
  },
  datePickerConfirm: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#1f78ff',
    marginLeft: 8,
    alignItems: 'center',
  },
  datePickerConfirmText: {
    color: '#fff',
    fontWeight: '700',
  },
});

