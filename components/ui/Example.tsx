/**
 * UI Kit Example Component
 * This file demonstrates how to use the UI kit components
 * 
 * This is for reference only - you can delete this file if not needed
 */

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useDesignSystem } from '@/hooks/use-design-system';
import {
  Button,
  Card,
  Input,
  Badge,
  UIText,
  Avatar,
  Divider,
  Container,
} from './index';

export function UIKitExample() {
  const { spacing } = useDesignSystem();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <ScrollView style={styles.scrollView}>
      <Container padding="lg">
        {/* Typography Examples */}
        <Card variant="elevated" padding="lg" style={{ marginBottom: spacing.lg }}>
          <UIText variant="h1" style={{ marginBottom: spacing.sm }}>
            Typography
          </UIText>
          <UIText variant="h2" style={{ marginBottom: spacing.xs }}>Heading 2</UIText>
          <UIText variant="h3" style={{ marginBottom: spacing.xs }}>Heading 3</UIText>
          <UIText variant="body">Body text</UIText>
          <UIText variant="bodySmall" color="secondary">Small body text</UIText>
          <UIText variant="caption" color="tertiary">Caption text</UIText>
        </Card>

        {/* Button Examples */}
        <Card variant="elevated" padding="lg" style={{ marginBottom: spacing.lg }}>
          <UIText variant="h2" style={{ marginBottom: spacing.md }}>
            Buttons
          </UIText>
          <Button variant="primary" size="lg" fullWidth style={{ marginBottom: spacing.sm }}>
            Primary Button
          </Button>
          <Button variant="secondary" size="md" fullWidth style={{ marginBottom: spacing.sm }}>
            Secondary Button
          </Button>
          <Button variant="outline" size="md" fullWidth style={{ marginBottom: spacing.sm }}>
            Outline Button
          </Button>
          <Button variant="ghost" size="md" fullWidth style={{ marginBottom: spacing.sm }}>
            Ghost Button
          </Button>
          <Button variant="danger" size="md" fullWidth style={{ marginBottom: spacing.sm }}>
            Danger Button
          </Button>
          <Button variant="primary" size="sm" loading>
            Loading...
          </Button>
        </Card>

        {/* Input Examples */}
        <Card variant="elevated" padding="lg" style={{ marginBottom: spacing.lg }}>
          <UIText variant="h2" style={{ marginBottom: spacing.md }}>
            Inputs
          </UIText>
          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={{ marginBottom: spacing.md }}
          />
          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error="Password must be at least 8 characters"
            style={{ marginBottom: spacing.md }}
          />
          <Input
            label="With Helper Text"
            placeholder="Enter text"
            helperText="This is helpful information"
          />
        </Card>

        {/* Badge Examples */}
        <Card variant="elevated" padding="lg" style={{ marginBottom: spacing.lg }}>
          <UIText variant="h2" style={{ marginBottom: spacing.md }}>
            Badges
          </UIText>
          <View style={styles.badgeRow}>
            <Badge variant="default">Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="info">Info</Badge>
          </View>
          <View style={[styles.badgeRow, { marginTop: spacing.sm }]}>
            <Badge variant="primary" size="sm">Small</Badge>
            <Badge variant="primary" size="md">Medium</Badge>
            <Badge variant="primary" size="lg">Large</Badge>
          </View>
        </Card>

        {/* Avatar Examples */}
        <Card variant="elevated" padding="lg" style={{ marginBottom: spacing.lg }}>
          <UIText variant="h2" style={{ marginBottom: spacing.md }}>
            Avatars
          </UIText>
          <View style={styles.avatarRow}>
            <Avatar size="xs" label="JD" />
            <Avatar size="sm" label="JD" />
            <Avatar size="md" label="JD" />
            <Avatar size="lg" label="JD" />
            <Avatar size="xl" label="JD" />
          </View>
        </Card>

        {/* Card Variants */}
        <Card variant="default" padding="lg" style={{ marginBottom: spacing.sm }}>
          <UIText variant="body">Default Card</UIText>
        </Card>
        <Card variant="elevated" padding="lg" style={{ marginBottom: spacing.sm }}>
          <UIText variant="body">Elevated Card</UIText>
        </Card>
        <Card variant="outlined" padding="lg" style={{ marginBottom: spacing.lg }}>
          <UIText variant="body">Outlined Card</UIText>
        </Card>

        {/* Divider */}
        <Divider spacing="lg" />
        <UIText variant="caption" color="tertiary" align="center" style={{ marginTop: spacing.lg }}>
          UI Kit Example Component
        </UIText>
      </Container>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
});


