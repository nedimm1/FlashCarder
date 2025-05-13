import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { styles } from "../styles/styles";
import { DataContext } from "../context/DataContext";
import { saveData } from "../utils/storage";

// Extend the imported styles with our additional styles
Object.assign(styles, {
  deckTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  studyBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  studyBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});

function LanguageDecksScreen({ route, navigation }) {
  const { language, displayName } = route.params;
  const { decks, updateDecks, studySessions } = React.useContext(DataContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState("");

  // Filter decks by language code
  const languageDecks = Array.isArray(decks)
    ? decks.filter((deck) => deck.language === language)
    : [];

  const handleDeleteLanguage = () => {
    Alert.alert(
      "Delete Language",
      `Are you sure you want to delete "${displayName}"? This will also delete all decks in this language.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Remove all decks in this language
              const updatedDecks = decks.filter(
                (deck) => deck.language !== language
              );

              // Update decks state first
              await saveData(updatedDecks);
              updateDecks(updatedDecks);

              // Get and update languages from storage
              const stored = await AsyncStorage.getItem("languages");
              if (stored) {
                const languages = JSON.parse(stored);
                const updatedLanguages = languages.filter(
                  (lang) => lang.code !== language
                );
                await AsyncStorage.setItem(
                  "languages",
                  JSON.stringify(updatedLanguages)
                );
              }

              // Ensure all state updates are complete before navigation
              setTimeout(() => {
                navigation.goBack();
              }, 100);
            } catch (error) {
              console.error("Error deleting language:", error);
              Alert.alert(
                "Error",
                "Failed to delete language. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerWithBack}>
        <TouchableOpacity
          style={styles.backArrow}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerText}>{displayName}</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                navigation.navigate("Languages", {
                  editLanguage: { code: language, displayName },
                });
              }}
            >
              <Ionicons name="pencil" size={20} color="#4CAF50" />
            </TouchableOpacity>
          </View>
          <Text style={styles.subHeaderText}>Select a Deck</Text>
        </View>
      </View>

      <FlatList
        data={languageDecks}
        keyExtractor={(item) => item.id}
        style={styles.deckList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.deckItemContainer}
            onPress={() =>
              navigation.navigate("Flashcards", { deckId: item.id })
            }
          >
            <View style={styles.deckContent}>
              <View style={styles.deckTitleContainer}>
                <Text style={styles.deckTitle}>{item.title}</Text>
                {studySessions[item.id] && (
                  <View style={styles.studyBadge}>
                    <Text style={styles.studyBadgeText}>Study in Progress</Text>
                  </View>
                )}
              </View>
              <Text style={styles.deckSubtitle}>{item.cards.length} cards</Text>
            </View>
            <TouchableOpacity
              style={styles.deckDeleteButton}
              onPress={() => {
                Alert.alert(
                  "Delete Deck",
                  `Are you sure you want to delete "${item.title}"?`,
                  [
                    {
                      text: "Cancel",
                      style: "cancel",
                    },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: () => {
                        const updatedDecks = decks.filter(
                          (d) => d.id !== item.id
                        );
                        updateDecks(updatedDecks);
                      },
                    },
                  ]
                );
              }}
            >
              <Ionicons name="trash-outline" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+ Add New Deck</Text>
      </TouchableOpacity>

      {/* Modal for adding new deck */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Deck</Text>
            <TextInput
              style={styles.input}
              placeholder="Deck Title"
              value={newDeckTitle}
              onChangeText={setNewDeckTitle}
              placeholderTextColor="#999"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#666" }]}
                onPress={() => {
                  setModalVisible(false);
                  setNewDeckTitle("");
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#4CAF50" }]}
                onPress={() => {
                  if (newDeckTitle.trim()) {
                    const newDeck = {
                      id: Date.now().toString(),
                      title: newDeckTitle,
                      language: language,
                      displayName: displayName,
                      cards: [],
                    };
                    const updatedDecks = Array.isArray(decks)
                      ? [...decks, newDeck]
                      : [newDeck];
                    updateDecks(updatedDecks);
                    setNewDeckTitle("");
                    setModalVisible(false);
                  }
                }}
              >
                <Text style={styles.buttonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default LanguageDecksScreen;
