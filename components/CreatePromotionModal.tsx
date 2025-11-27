import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { supabase } from '../lib/supabase';
import { uploadCompressedImage } from '../lib/imageUtils';
import DateTimePicker from '@react-native-community/datetimepicker';

interface CreatePromotionModalProps {
  visible: boolean;
  onClose: () => void;
  storeId: string;
  userId: string;
  onSuccess?: () => void;
}

export default function CreatePromotionModal({
  visible,
  onClose,
  storeId,
  userId,
  onSuccess,
}: CreatePromotionModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date>(new Date(Date.now() + 24 * 60 * 60 * 1000)); // Default: 24 hours from now
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [uploading, setUploading] = useState(false);

  const wordCount = description.trim().split(/\s+/).filter(Boolean).length;
  const maxWords = 60;

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need camera roll permissions to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setExpiresAt(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      // Combine date and time
      const newDate = new Date(expiresAt);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      newDate.setSeconds(0);
      setExpiresAt(newDate);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a promotion title');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter promotion details');
      return;
    }

    if (wordCount > maxWords) {
      Alert.alert('Error', `Description must be ${maxWords} words or less`);
      return;
    }

    if (!imageUri) {
      Alert.alert('Error', 'Please upload a promotion image');
      return;
    }

    if (expiresAt <= new Date()) {
      Alert.alert('Error', 'Expiration date must be in the future');
      return;
    }

    try {
      setUploading(true);

      // Upload image
      const imagePath = await uploadCompressedImage(
        imageUri,
        `promotions/${userId}/${Date.now()}_promotion.jpg`,
        'tus',
        { compress: 0.5, maxWidth: 1024 }
      );

      // Insert promotion into database
      const { error } = await supabase.from('promotions').insert([
        {
          store_id: storeId,
          user_id: userId,
          title: title.trim(),
          description: description.trim(),
          image_url: imagePath,
          expires_at: expiresAt.toISOString(),
          is_active: true,
        },
      ]);

      if (error) {
        throw error;
      }

      // Reset form
      setTitle('');
      setDescription('');
      setImageUri(null);
      setExpiresAt(new Date(Date.now() + 24 * 60 * 60 * 1000));
      onClose();
      onSuccess?.();
      Alert.alert('Success', 'Promotion created successfully!');
    } catch (error: any) {
      console.error('Error creating promotion:', error);
      Alert.alert('Error', error.message || 'Failed to create promotion');
    } finally {
      setUploading(false);
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Promotion</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            {/* Title Input */}
            <Text style={styles.label}>Promotion Title *</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Enter promotion title"
              placeholderTextColor="#999"
              style={styles.input}
              maxLength={100}
            />

            {/* Description Input */}
            <Text style={styles.label}>
              Promotion Details * ({wordCount}/{maxWords} words)
            </Text>
            <TextInput
              value={description}
              onChangeText={(text) => {
                const words = text.trim().split(/\s+/).filter(Boolean);
                if (words.length <= maxWords) {
                  setDescription(text);
                } else {
                  setDescription(words.slice(0, maxWords).join(' '));
                }
              }}
              placeholder="Describe your promotion (max 60 words)"
              placeholderTextColor="#999"
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Image Upload */}
            <Text style={styles.label}>Promotion Image *</Text>
            <TouchableOpacity style={styles.imageUploadButton} onPress={pickImage}>
              {imageUri ? (
                <View style={styles.imagePreview}>
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.previewImage}
                    contentFit="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setImageUri(null)}
                  >
                    <Icon name="close-circle" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Icon name="image-outline" size={40} color="#999" />
                  <Text style={styles.uploadText}>Tap to upload image</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Expiration Date/Time */}
            <Text style={styles.label}>Expiration Date & Time *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Icon name="calendar-outline" size={20} color="#1f78ff" />
              <Text style={styles.dateText}>{formatDateTime(expiresAt)}</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={expiresAt}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={expiresAt}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
              />
            )}

            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Icon name="time-outline" size={20} color="#1f78ff" />
              <Text style={styles.dateText}>Change Time</Text>
            </TouchableOpacity>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={uploading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton, uploading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Create Promotion</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  form: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
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
    height: 100,
    textAlignVertical: 'top',
  },
  imageUploadButton: {
    marginTop: 8,
  },
  uploadPlaceholder: {
    height: 150,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  uploadText: {
    marginTop: 8,
    color: '#999',
    fontSize: 14,
  },
  imagePreview: {
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  dateText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#000',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f3f3',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#1f78ff',
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

