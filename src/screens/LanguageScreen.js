//secret message
import React, { useState, useEffect } from "react";
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
import LanguageSelector from "../components/LanguageSelector";
import { SUPPORTED_LANGUAGES } from "../services/translationService";

function LanguageScreen({ route, navigation }) {
  const { decks, updateDecks, isLoading } = React.useContext(DataContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [editingLanguage, setEditingLanguage] = useState(null);

  // Store languages with their codes and display names
  const [languages, setLanguages] = useState([]);

  // Load languages on mount
  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const stored = await AsyncStorage.getItem("languages");
        if (stored) {
          const parsedLanguages = JSON.parse(stored);

          // Migration: Convert old format to new format if needed
          const migratedLanguages = parsedLanguages.map((lang) => {
            // If it's already in the new format, return as is
            if (lang.code && lang.displayName) {
              return lang;
            }

            // If it's in the old format (just the language code)
            // Create the new format with the code and a display name
            const displayName =
              Object.entries(SUPPORTED_LANGUAGES).find(
                ([name, code]) => code === lang
              )?.[0] || lang;

            return {
              code: lang,
              displayName: displayName,
            };
          });

          setLanguages(migratedLanguages);

          // Save the migrated format back to storage
          await AsyncStorage.setItem(
            "languages",
            JSON.stringify(migratedLanguages)
          );
        }
      } catch (error) {
        console.error("Error loading languages:", error);
      }
    };
    loadLanguages();
  }, []);

  // Save languages whenever they change
  useEffect(() => {
    const saveLanguages = async () => {
      try {
        await AsyncStorage.setItem("languages", JSON.stringify(languages));
      } catch (error) {
        console.error("Error saving languages:", error);
      }
    };
    if (languages.length > 0) {
      saveLanguages();
    }
  }, [languages]);

  // Add languages from existing decks that might not be in our languages list
  useEffect(() => {
    const migrateDecks = async () => {
      if (!decks) return; // Guard against undefined decks

      const updatedDecks = decks.map((deck) => {
        // If deck already has the new format, return as 
        if (deck.displayName) {
          return deck;
        }

        // Find display name for the language
        const displayName =
          Object.entries(SUPPORTED_LANGUAGES).find(
            ([name, code]) => code === deck.language
          )?.[0] || deck.language;

        return {
          ...deck,
          displayName: displayName,
        };
      });

      // Update decks if any were migrated
      if (
        updatedDecks.some(
          (deck, i) => deck.displayName !== decks[i].displayName
        )
      ) {
        updateDecks(updatedDecks);
      }

      // Create language entries from decks
      const deckLanguages = updatedDecks.map((deck) => ({
        code: deck.language,
        displayName: deck.displayName,
      }));

      setLanguages((prev) => {
        const existingCodes = new Set(prev.map((lang) => lang.code));
        const newLanguages = deckLanguages.filter(
          (lang) => !existingCodes.has(lang.code)
        );

        return [...prev, ...newLanguages];
      });
    };

    migrateDecks();
  }, [decks]);

  // Handle edit navigation from LanguageDecksScreen
  useEffect(() => {
    if (route.params?.editLanguage) {
      const language = route.params.editLanguage;
      setEditingLanguage(language);
      setSelectedLanguage(language.code);
      setDisplayName(language.displayName);
      setEditModalVisible(true);
    }
  }, [route.params?.editLanguage]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Flashcarder</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Count decks per language
  const deckCounts = languages.reduce((acc, lang) => {
    if (!Array.isArray(decks)) {
      acc[lang.code] = 0;
      return acc;
    }
    acc[lang.code] = decks.filter((deck) => deck.language === lang.code).length;
    return acc;
  }, {});

  // Handle language deletion
  const handleDeleteLanguage = (language) => {
    Alert.alert(
      "Delete Language",
      `Are you sure you want to delete "${language.displayName}"? This will also delete all decks in this category.`,
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
              // Remove language from languages list
              const updatedLanguages = languages.filter(
                (lang) =>
                  !(
                    lang.code === language.code &&
                    lang.displayName === language.displayName
                  )
              );
              setLanguages(updatedLanguages);
              await AsyncStorage.setItem(
                "languages",
                JSON.stringify(updatedLanguages)
              );

              // Remove only decks that match both language code and display name
              const updatedDecks = decks.filter(
                (deck) =>
                  !(
                    deck.language === language.code &&
                    deck.displayName === language.displayName
                  )
              );
              updateDecks(updatedDecks);
            } catch (error) {
              console.error("Error deleting language:", error);
            }
          },
        },
      ]
    );
  };

  const handleEditLanguage = (language) => {
    setEditingLanguage(language);
    setSelectedLanguage(language.code);
    setDisplayName(language.displayName);
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    if (!displayName.trim()) {
      Alert.alert("Error", "Please enter a name for this language section");
      return;
    }

    setLanguages((prev) =>
      prev.map((lang) =>
        lang.code === editingLanguage.code
          ? { code: selectedLanguage, displayName: displayName.trim() }
          : lang
      )
    );

    // Update all decks using this language
    const updatedDecks = decks.map((deck) =>
      deck.language === editingLanguage.code
        ? {
            ...deck,
            language: selectedLanguage,
            displayName: displayName.trim(),
          }
        : deck
    );
    updateDecks(updatedDecks);

    setEditingLanguage(null);
    setSelectedLanguage("");
    setDisplayName("");
    setEditModalVisible(false);
  };

  const handleCreateLanguage = () => {
    if (!displayName.trim()) {
      Alert.alert("Error", "Please enter a name for this language section");
      return;
    }

    const newLanguage = {
      code: selectedLanguage,
      displayName: displayName.trim(),
    };

    setLanguages((prev) => [...prev, newLanguage]);
    setSelectedLanguage("");
    setDisplayName("");
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Flashcarder</Text>
      </View>
      <Text style={styles.subHeaderText}>Select a Language</Text>

      <FlatList
        data={languages}
        keyExtractor={(item) => `${item.code}-${item.displayName}`}
        style={styles.deckList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.languageItemContainer}
            onPress={() =>
              navigation.navigate("LanguageDecks", {
                language: item.code,
                displayName: item.displayName,
              })
            }
          >
            <View style={styles.languageContent}>
              <Text style={styles.languageTitle}>{item.displayName}</Text>
              <Text style={styles.languageSubtitle}>
                {deckCounts[item.code] || 0}{" "}
                {(deckCounts[item.code] || 0) === 1 ? "deck" : "decks"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.languageDeleteButton}
              onPress={() => handleDeleteLanguage(item)}
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
        <Text style={styles.addButtonText}>+ Add New Language Category</Text>
      </TouchableOpacity>

      {/* Add Language Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Language Category</Text>
            <TextInput
              style={styles.input}
              placeholder="Name for the language category"
              placeholderTextColor="#999"
              value={displayName}
              onChangeText={setDisplayName}
            />
            <Text style={styles.inputLabel}>
              Select Language for Translation:
            </Text>
            <LanguageSelector
              selectedLanguage={selectedLanguage}
              onSelect={setSelectedLanguage}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#666" }]}
                onPress={() => {
                  setModalVisible(false);
                  setSelectedLanguage("");
                  setDisplayName("");
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#4CAF50" }]}
                onPress={handleCreateLanguage}
              >
                <Text style={styles.buttonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Language Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => {
          setEditModalVisible(false);
          setEditingLanguage(null);
          setSelectedLanguage("");
          setDisplayName("");
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Language</Text>
            <TextInput
              style={styles.input}
              placeholder="Name for the language category"
              placeholderTextColor="#999"
              value={displayName}
              onChangeText={setDisplayName}
            />
            <Text style={styles.inputLabel}>
              Select Language for Translation:
            </Text>
            <LanguageSelector
              selectedLanguage={selectedLanguage}
              onSelect={setSelectedLanguage}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#666" }]}
                onPress={() => {
                  setEditModalVisible(false);
                  setEditingLanguage(null);
                  setSelectedLanguage("");
                  setDisplayName("");
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#4CAF50" }]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  languageActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  languageEditButton: {
    padding: 8,
    marginRight: 8,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    borderRadius: 8,
  },
});

export default LanguageScreen;
