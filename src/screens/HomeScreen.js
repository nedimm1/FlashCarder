import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { DataContext } from "../context/DataContext";

export const HomeScreen = ({ navigation }) => {
  const { decks } = useContext(DataContext);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {decks.map((deck, index) => (
          <TouchableOpacity
            key={index}
            style={styles.deckButton}
            onPress={() =>
              navigation.navigate("DeckDetail", { deckIndex: index })
            }
          >
            <Text style={styles.deckTitle}>{deck.name}</Text>
            <Text style={styles.cardCount}>{deck.cards.length} cards</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("AddDeck")}
      >
        <Text style={styles.addButtonText}>Add New Deck</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  deckButton: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  deckTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  cardCount: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  addButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
