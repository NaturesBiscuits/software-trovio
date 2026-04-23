import { Text } from "react-native";
import type { StyleProp, TextStyle } from "react-native";

type AppTextProps = {
  children: React.ReactNode;
  size?: "small" | "medium" | "large" | "heading";
  bold?: boolean;
  color?: "primary" | "secondary" | "tertiary";
  center?: boolean;
  className?: string;
  style?: StyleProp<TextStyle>;
};

export function AppText({
  children,
  size = "medium",
  bold = false,
  color = "primary",
  center = false,
  style,
}: AppTextProps) {
  const computedStyle: TextStyle = {
    fontSize:
      size === "small" ? 14 :
      size === "medium" ? 16 :
      size === "large" ? 18 :
      20,
    marginBottom:
      size === "small" ? 8 :
      size === "medium" ? 12 :
      size === "large" ? 16 :
      20,
    fontWeight: bold ? "700" : "400",
    color:
      color === "primary" ? "#000" :
      color === "secondary" ? "#6b7280" :
      "#9ca3af",
    textAlign: center ? "center" : "left",
  };

  return (
    <Text style={[computedStyle, style]}>
      {children}
    </Text>
  );
}
