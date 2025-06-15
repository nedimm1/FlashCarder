import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";
import { loadData, saveData, clearStorage } from "../utils/storage";

export const DataContext = React.createContext();

export const DataProvider = ({ children }) => {
  const [decks, setDecks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [studySessions, setStudySessions] = useState({});

  // Load data on app start
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        // Load existing data from storage
        const savedDecks = await loadData("flashcards_data");
        const savedSessions = await loadData("studySessions");

        if (isMounted) {
          setDecks(savedDecks);
          setStudySessions(savedSessions);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        if (isMounted) {
          setDecks([]);
          setStudySessions({});
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Save data whenever decks change
  const updateDecks = async (newDecks) => {
    setDecks(newDecks || []);
    await saveData(newDecks || [], "flashcards_data");
  };

  // Save and update study session
  const updateStudySession = async (deckId, sessionData) => {
    if (!sessionData) {
      const newSessions = { ...studySessions };
      delete newSessions[deckId];
      setStudySessions(newSessions);
      await saveData(newSessions, "studySessions");
    } else {
      const newSessions = {
        ...studySessions,
        [deckId]: sessionData,
      };
      setStudySessions(newSessions);
      await saveData(newSessions, "studySessions");
    }
  };

  // Clear study session
  const clearStudySession = (deckId) => {
    updateStudySession(deckId, null);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#1a1a1a", padding: 20 }}>
        <Text style={{ color: "#fff" }}>Loading...</Text>
      </View>
    );
  }

  return (
    <DataContext.Provider
      value={{
        decks,
        updateDecks,
        studySessions,
        updateStudySession,
        clearStudySession,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
