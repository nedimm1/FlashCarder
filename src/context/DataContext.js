import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";
import { loadData, saveData } from "../utils/storage";

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
        const data = await loadData();
        if (isMounted) {
          setDecks(data || []);
          const sessions = await loadData("studySessions");
          setStudySessions(sessions || {});
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
  const updateDecks = (newDecks) => {
    setDecks(newDecks || []);
    saveData(newDecks || []);
  };

  // Save and update study session
  const updateStudySession = (deckId, sessionData) => {
    const newSessions = {
      ...studySessions,
      [deckId]: sessionData,
    };
    setStudySessions(newSessions);
    saveData(newSessions, "studySessions");
  };

  // Clear study session
  const clearStudySession = (deckId) => {
    const newSessions = { ...studySessions };
    delete newSessions[deckId];
    setStudySessions(newSessions);
    saveData(newSessions, "studySessions");
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
