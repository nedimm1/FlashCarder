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

function LanguageScreen({ navigation }) {
  const { decks, updateDecks } = React.useContext(DataContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [newLanguage, setNewLanguage] = useState("");

  // Get unique languages from decks and manually added languages
  const [languages, setLanguages] = useState([]);

  // Load languages on mount
  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const stored = await AsyncStorage.getItem("languages");
        if (stored) {
          setLanguages(JSON.parse(stored));
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

  // Count decks per language
  const deckCounts = languages.reduce((acc, lang) => {
    acc[lang] = decks.filter((deck) => deck.language === lang).length;
    return acc;
  }, {});

  // Add languages from existing decks that might not be in our languages list
  useEffect(() => {
    const deckLanguages = [...new Set(decks.map((deck) => deck.language))];
    setLanguages((prev) => {
      const newLanguages = [...new Set([...prev, ...deckLanguages])];
      return newLanguages;
    });
  }, [decks]);

  // Handle language deletion
  const handleDeleteLanguage = (language) => {
    Alert.alert(
      "Delete Language",
      `Are you sure you want to delete "${language}"? This will also delete all decks in this language.`,
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
                (lang) => lang !== language
              );
              setLanguages(updatedLanguages);
              await AsyncStorage.setItem(
                "languages",
                JSON.stringify(updatedLanguages)
              );

              // Remove all decks in this language
              const updatedDecks = decks.filter(
                (deck) => deck.language !== language
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Flashcarder</Text>
      </View>
      <Text style={styles.subHeaderText}>Select a Language</Text>

      <FlatList
        data={languages}
        keyExtractor={(item) => item}
        style={styles.deckList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.languageItemContainer}
            onPress={() =>
              navigation.navigate("LanguageDecks", { language: item })
            }
          >
            <View style={styles.languageContent}>
              <Text style={styles.languageTitle}>{item}</Text>
              <Text style={styles.languageSubtitle}>
                {deckCounts[item] || 0}{" "}
                {(deckCounts[item] || 0) === 1 ? "deck" : "decks"}
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
        <Text style={styles.addButtonText}>+ Add New Language</Text>
      </TouchableOpacity>

      {/* Modal for adding new language */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Language</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter language name"
              value={newLanguage}
              onChangeText={setNewLanguage}
              placeholderTextColor="#999"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#666" }]}
                onPress={() => {
                  setModalVisible(false);
                  setNewLanguage("");
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#4CAF50" }]}
                onPress={() => {
                  if (newLanguage.trim()) {
                    // Add the new language to our list
                    setLanguages((prev) => [
                      ...new Set([...prev, newLanguage.trim()]),
                    ]);
                    setNewLanguage("");
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

export default LanguageScreen;
