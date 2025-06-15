import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Switch,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../styles/styles";
import { DataContext } from "../context/DataContext";
import { translateText } from "../services/translationService";

function AddCardScreen({ route, navigation }) {
  const { deckId } = route.params;
  const { decks, updateDecks } = React.useContext(DataContext);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [example, setExample] = useState("");
  const [pronunciation, setPronunciation] = useState("");
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationDirection, setTranslationDirection] = useState(null);
  const [isEnglishFirst, setIsEnglishFirst] = useState(false);

  // Find the current deck
  const deckIndex = decks.findIndex((d) => d.id === deckId);
  const deck = decks[deckIndex];

  const getInputLabel = (isArabic) => {
    if (isArabic) {
      return `${isEnglishFirst ? "Back" : "Front"} (Arabic)`;
    }
    return `${isEnglishFirst ? "Front" : "Back"} (English)`;
  };

  // Handle auto-translation
  useEffect(() => {
    let timeoutId;

    const performTranslation = async () => {
      if (!autoTranslate || !translationDirection) return;

      try {
        setIsTranslating(true);
        const textToTranslate =
          translationDirection === "toEnglish" ? front : back;

        if (textToTranslate.trim()) {
          const translatedText = await translateText(
            textToTranslate,
            translationDirection === "toEnglish" ? "ar" : "en",
            translationDirection === "toEnglish" ? "en" : "ar"
          );

          if (translationDirection === "toEnglish") {
            setBack(translatedText);
          } else {
            setFront(translatedText);
          }
        }
      } catch (error) {
        console.error("Translation failed:", error);
        Alert.alert(
          "Translation Error",
          "Failed to translate text. Please try again or enter text manually."
        );
      } finally {
        setIsTranslating(false);
        setTranslationDirection(null);
      }
    };

    // Add a longer delay to avoid rate limiting
    if (translationDirection) {
      timeoutId = setTimeout(performTranslation, 1500);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [front, back, autoTranslate, translationDirection]);

  const handleTextChange = (text, isArabic) => {
    if (isArabic) {
      setFront(text);
      if (autoTranslate && text.trim()) {
        // Add a small delay before setting translation direction
        setTimeout(() => setTranslationDirection("toEnglish"), 500);
      }
    } else {
      setBack(text);
      if (autoTranslate && text.trim()) {
        setTimeout(() => setTranslationDirection("toTarget"), 500);
      }
    }
  };

  const addCard = () => {
    if (front.trim() && back.trim()) {
      const newCard = {
        id: Date.now().toString(),
        front: isEnglishFirst ? back : front,
        back: isEnglishFirst ? front : back,
        example: example.trim() || null,
        pronunciation: pronunciation.trim() || null,
        isEnglishFirst: isEnglishFirst,
        createdAt: new Date().toISOString(),
      };

      const updatedDeck = {
        ...deck,
        cards: [...deck.cards, newCard],
      };

      const updatedDecks = [...decks];
      updatedDecks[deckIndex] = updatedDeck;

      updateDecks(updatedDecks);

      setFront("");
      setBack("");
      setExample("");
      setPronunciation("");
      setTranslationDirection(null);

      Alert.alert("Success", "Card added successfully!");
    } else {
      Alert.alert("Error", "Please fill in both sides of the card");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "#1a1a1a" }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={addCardStyles.scrollContent}
        >
          <View style={styles.headerWithBack}>
            <TouchableOpacity
              style={styles.backArrow}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={[styles.headerText, { fontSize: 24 }]}>
                Add New Card
              </Text>
              <Text style={[styles.subHeaderText, { color: "#999" }]}>
                to {deck.title}
              </Text>
            </View>
          </View>

          <View style={addCardStyles.content}>
            <View style={addCardStyles.autoTranslateContainer}>
              <Text style={addCardStyles.label}>Auto-translate</Text>
              <Switch
                value={autoTranslate}
                onValueChange={(value) => {
                  setAutoTranslate(value);
                  setTranslationDirection(null);
                }}
                trackColor={{ false: "#444", true: "#4CAF50" }}
                thumbColor={autoTranslate ? "#fff" : "#f4f3f4"}
              />
            </View>

            <View style={addCardStyles.autoTranslateContainer}>
              <Text style={addCardStyles.label}>Show English on front</Text>
              <Switch
                value={isEnglishFirst}
                onValueChange={setIsEnglishFirst}
                trackColor={{ false: "#444", true: "#4CAF50" }}
                thumbColor={isEnglishFirst ? "#fff" : "#f4f3f4"}
              />
            </View>

            <View style={addCardStyles.inputContainer}>
              <Text style={addCardStyles.label}>{getInputLabel(true)}</Text>
              <TextInput
                style={[
                  addCardStyles.input,
                  {
                    textAlign: "right",
                    writingDirection: "rtl",
                    fontFamily: Platform.OS === "ios" ? "Arial" : "sans-serif",
                    fontSize: 20,
                  },
                ]}
                value={front}
                onChangeText={(text) => handleTextChange(text, true)}
                placeholder="Write here..."
                placeholderTextColor="#666"
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
              />

              <Text style={[addCardStyles.label, { marginTop: 15 }]}>
                {getInputLabel(false)}
              </Text>
              {isTranslating && (
                <View style={addCardStyles.translatingContainer}>
                  <ActivityIndicator color="#4CAF50" />
                  <Text style={addCardStyles.translatingText}>
                    Translating...
                  </Text>
                </View>
              )}
              <TextInput
                style={[
                  addCardStyles.input,
                  {
                    textAlign: "left",
                    writingDirection: "ltr",
                  },
                ]}
                value={back}
                onChangeText={(text) => handleTextChange(text, false)}
                placeholder="Enter English translation..."
                placeholderTextColor="#666"
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
              />

              <Text style={[addCardStyles.label, { marginTop: 15 }]}>
                Pronunciation (Optional)
              </Text>
              <TextInput
                style={[
                  addCardStyles.input,
                  {
                    height: 60,
                    textAlign: "left",
                  },
                ]}
                value={pronunciation}
                onChangeText={setPronunciation}
                placeholder="Enter pronunciation..."
                placeholderTextColor="#666"
                multiline={true}
                numberOfLines={2}
                textAlignVertical="top"
              />

              <Text style={[addCardStyles.label, { marginTop: 15 }]}>
                Example (Optional)
              </Text>
              <TextInput
                style={[
                  addCardStyles.input,
                  {
                    textAlign: "right",
                    writingDirection: "rtl",
                    fontFamily: Platform.OS === "ios" ? "Arial" : "sans-serif",
                    fontSize: 18,
                  },
                ]}
                value={example}
                onChangeText={setExample}
                placeholder="Enter example..."
                placeholderTextColor="#666"
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>

        <TouchableOpacity style={addCardStyles.addButton} onPress={addCard}>
          <Text style={addCardStyles.addButtonText}>Add Card</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const addCardStyles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  autoTranslateContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#2a2a2a",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 8,
    fontWeight: "500",
  },
  inputContainer: {
    flex: 1,
  },
  input: {
    backgroundColor: "#2a2a2a",
    borderRadius: 10,
    padding: 15,
    color: "#fff",
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 15,
    lineHeight: 24,
  },
  translatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  translatingText: {
    color: "#4CAF50",
    marginLeft: 8,
    fontSize: 14,
  },
  addButton: {
    backgroundColor: "#4CAF50",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default AddCardScreen;
