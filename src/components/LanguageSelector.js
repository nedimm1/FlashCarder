import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SUPPORTED_LANGUAGES } from "../services/translationService";

const windowHeight = Dimensions.get("window").height;

export default function LanguageSelector({ onSelect, selectedLanguage }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  const filteredLanguages = Object.entries(SUPPORTED_LANGUAGES)
    .filter(([name, code]) =>
      name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .map(([name, code]) => ({ name, code }));

  const handleSelect = (language) => {
    onSelect(language.code);
    setIsDropdownVisible(false);
    setSearchQuery("");
  };

  const selectedName = Object.entries(SUPPORTED_LANGUAGES).find(
    ([name, code]) => code === selectedLanguage
  )?.[0];

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setIsDropdownVisible(!isDropdownVisible)}
      >
        <Text style={styles.selectedText}>
          {selectedName || "Select a language"}
        </Text>
      </TouchableOpacity>

      {isDropdownVisible && (
        <View style={styles.dropdownContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search languages..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <View style={styles.listWrapper}>
            <FlatList
              data={filteredLanguages}
              keyExtractor={(item) => item.code}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
              scrollEnabled={true}
              nestedScrollEnabled={true}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageItem,
                    selectedLanguage === item.code && styles.selectedItem,
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <Text
                    style={[
                      styles.languageText,
                      selectedLanguage === item.code && styles.selectedItemText,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 20,
    zIndex: 1,
  },
  dropdownButton: {
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#444",
  },
  selectedText: {
    color: "#fff",
    fontSize: 16,
  },
  dropdownContainer: {
    backgroundColor: "#2a2a2a",
    borderRadius: 10,
    marginTop: 5,
    borderWidth: 1,
    borderColor: "#444",
    maxHeight: windowHeight * 0.8,
  },
  searchInput: {
    backgroundColor: "#333",
    padding: 15,
    color: "#fff",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    fontSize: 16,
  },
  listWrapper: {
    height: windowHeight * 0.7,
  },
  languageItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  selectedItem: {
    backgroundColor: "#4CAF50",
  },
  languageText: {
    color: "#fff",
    fontSize: 16,
  },
  selectedItemText: {
    fontWeight: "bold",
  },
});
