import React, { useState, useRef } from 'react';
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
  ScrollView,
  KeyboardAvoidingView,
  InputAccessoryView,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
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
  const [iosPickerMode, setIosPickerMode] = useState<'date' | 'time'>('date');
  const [uploading, setUploading] = useState(false);
  const descriptionInputRef = useRef<TextInput>(null);

  const wordCount = description.trim().split(/\s+/).filter(Boolean).length;
  const maxWords = 60;

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need camera roll permissions to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate && event.type !== 'dismissed') {
      // Preserve the current time when changing date
      const newDate = new Date(selectedDate);
      newDate.setHours(expiresAt.getHours());
      newDate.setMinutes(expiresAt.getMinutes());
      newDate.setSeconds(0);
      setExpiresAt(newDate);
    }
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      setShowTimePicker(false);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime && event.type !== 'dismissed') {
      // Preserve the current date when changing time
      const newDate = new Date(expiresAt);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      newDate.setSeconds(0);
      setExpiresAt(newDate);
    }
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      setShowTimePicker(false);
    }
  };

  const dismissKeyboard = () => {
    descriptionInputRef.current?.blur();
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

  const inputAccessoryViewID = 'descriptionInputAccessory';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Promotion</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
          >
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
            {Platform.OS === 'ios' && (
              <InputAccessoryView nativeID={inputAccessoryViewID}>
                <View style={styles.inputAccessory}>
                  <TouchableOpacity
                    onPress={dismissKeyboard}
                    style={styles.doneButton}
                  >
                    <Text style={styles.doneButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </InputAccessoryView>
            )}
            <TextInput
              ref={descriptionInputRef}
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
              inputAccessoryViewID={Platform.OS === 'ios' ? inputAccessoryViewID : undefined}
              returnKeyType="done"
              blurOnSubmit={true}
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
            <View style={styles.dateTimeContainer}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  if (Platform.OS === 'ios') {
                    setIosPickerMode('date');
                    setShowDatePicker(true);
                    setShowTimePicker(true);
                  } else {
                    setShowDatePicker(true);
                    setShowTimePicker(false);
                  }
                }}
              >
                <Icon name="calendar-outline" size={20} color="#1f78ff" />
                <Text style={styles.dateText}>{formatDateTime(expiresAt)}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => {
                  if (Platform.OS === 'ios') {
                    setIosPickerMode('time');
                    setShowDatePicker(true);
                    setShowTimePicker(true);
                  } else {
                    setShowTimePicker(true);
                    setShowDatePicker(false);
                  }
                }}
              >
                <Icon name="time-outline" size={20} color="#1f78ff" />
                <Text style={styles.dateText}>Change Time</Text>
              </TouchableOpacity>
            </View>

            {/* Android Date/Time Pickers */}
            {Platform.OS === 'android' && showDatePicker && (
              <DateTimePicker
                value={expiresAt}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}

            {Platform.OS === 'android' && showTimePicker && (
              <DateTimePicker
                value={expiresAt}
                mode="time"
                display="default"
                onChange={handleTimeChange}
              />
            )}

            {/* iOS Date/Time Picker Modal */}
            {Platform.OS === 'ios' && showDatePicker && (
              <Modal
                visible={showDatePicker}
                transparent
                animationType="slide"
                onRequestClose={() => {
                  setShowDatePicker(false);
                  setShowTimePicker(false);
                }}
              >
                <View style={styles.iosPickerOverlay}>
                  <TouchableOpacity
                    style={styles.iosPickerBackdrop}
                    activeOpacity={1}
                    onPress={() => {
                      setShowDatePicker(false);
                      setShowTimePicker(false);
                    }}
                  />
                  <View style={styles.iosPickerContainer}>
                    <View style={styles.iosPickerHeader}>
                      <TouchableOpacity
                        onPress={() => {
                          setShowDatePicker(false);
                          setShowTimePicker(false);
                        }}
                      >
                        <Text style={styles.iosPickerCancel}>Cancel</Text>
                      </TouchableOpacity>
                      <View style={styles.iosPickerModeSelector}>
                        <TouchableOpacity
                          style={[styles.iosPickerModeButton, iosPickerMode === 'date' && styles.iosPickerModeButtonActive]}
                          onPress={() => setIosPickerMode('date')}
                        >
                          <Text style={[styles.iosPickerModeText, iosPickerMode === 'date' && styles.iosPickerModeTextActive]}>
                            Date
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.iosPickerModeButton, iosPickerMode === 'time' && styles.iosPickerModeButtonActive]}
                          onPress={() => setIosPickerMode('time')}
                        >
                          <Text style={[styles.iosPickerModeText, iosPickerMode === 'time' && styles.iosPickerModeTextActive]}>
                            Time
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          setShowDatePicker(false);
                          setShowTimePicker(false);
                        }}
                      >
                        <Text style={styles.iosPickerDone}>Done</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.iosPickerContent}>
                      <DateTimePicker
                        key={iosPickerMode}
                        value={expiresAt}
                        mode={iosPickerMode}
                        display="spinner"
                        onChange={iosPickerMode === 'date' ? handleDateChange : handleTimeChange}
                        minimumDate={iosPickerMode === 'date' ? new Date() : undefined}
                        style={styles.iosPicker}
                        textColor="#000"
                        themeVariant="light"
                        locale="en_US"
                      />
                    </View>
                  </View>
                </View>
              </Modal>
            )}
              </View>
            </ScrollView>

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
        </KeyboardAvoidingView>
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
  scrollView: {
    maxHeight: 400,
  },
  scrollContent: {
    paddingBottom: 10,
  },
  inputAccessory: {
    backgroundColor: '#f0f0f0',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  doneButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  doneButtonText: {
    color: '#1f78ff',
    fontSize: 16,
    fontWeight: '600',
  },
  dateTimeContainer: {
    gap: 8,
  },
  iosPickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  iosPickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  iosPickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '50%',
  },
  iosPickerContent: {
    height: 216,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  iosPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  iosPickerCancel: {
    fontSize: 16,
    color: '#666',
  },
  iosPickerDone: {
    fontSize: 16,
    color: '#1f78ff',
    fontWeight: '600',
  },
  iosPicker: {
    width: '100%',
    height: 216,
  },
  iosPickerModeSelector: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  iosPickerModeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  iosPickerModeButtonActive: {
    backgroundColor: '#1f78ff',
  },
  iosPickerModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  iosPickerModeTextActive: {
    color: '#fff',
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

