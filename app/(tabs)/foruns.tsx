import api from "@/config/api";
import { useAppDispatch } from "@/store";
import { clearUser } from "@/store/authSlice";
import { Forum, Reply, Topic } from "@/types/forum";
import { formatDateAgo } from "@/utils/dateHelper";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Button, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function TabTwoScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const [forums, setForums] = useState<Forum[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);

  const [selectedForum, setSelectedForum] = useState<Forum | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const [forumSearch, setForumSearch] = useState("");
  const [topicSearch, setTopicSearch] = useState("");

  const [isForumsLoading, setIsForumsLoading] = useState(true);
  const [isTopicsLoading, setIsTopicsLoading] = useState(false);
  const [isRepliesLoading, setIsRepliesLoading] = useState(false);

  useEffect(() => {
    const loadForums = async () => {
      setIsForumsLoading(true);
      try {
        const data = await api.get('forum');
        setForums(data.data);
      } catch (e) {
        Alert.alert("Erro", "Não foi possível carregar os fóruns.");
      } finally {
        setIsForumsLoading(false);
      }
    };
    loadForums();
  }, []);

  useEffect(() => {
    if (selectedForum) {
      const loadTopics = async () => {
        setIsTopicsLoading(true);
        setTopics([]);
        try {
          const data = await api.get(`forum/${selectedForum.id}/topics`);
          setTopics(data.data);
        } catch (e) {
          Alert.alert("Erro", "Não foi possível carregar os tópicos.");
        } finally {
          setIsTopicsLoading(false);
        }
      };
      loadTopics();
    } else {
      setTopics([]);
    }
  }, [selectedForum]);

  useEffect(() => {
    if (selectedTopic && selectedForum) {
      const loadReplies = async () => {
        setIsRepliesLoading(true);
        setReplies([]);
        try {
          const data = await api.get(`forum/${selectedForum.id}/topics/${selectedTopic.id}/replies`);
          setReplies(data.data);
        } catch (e) {
          Alert.alert("Erro", "Não foi possível carregar as respostas.");
        } finally {
          setIsRepliesLoading(false);
        }
      };
      loadReplies();
    } else {
      setReplies([]);
    }
  }, [selectedTopic, selectedForum]);


  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("auth_user");
      dispatch(clearUser());
      router.replace("/login" as any);
    } catch (e) {
      Alert.alert("Erro", "Não foi possível deslogar. Tente novamente.");
    }
  };

  const filteredForums = forums.filter(f =>
    f.name.toLowerCase().includes(forumSearch.toLowerCase())
  );

  const filteredTopics = topics.filter((t: any) =>
    t.title.toLowerCase().includes(topicSearch.toLowerCase())
  );

  const renderForums = () => (
    <View style={styles.section}>
      <Text style={styles.header}>Fóruns</Text>
      <TextInput
        placeholder="Buscar fórum..."
        value={forumSearch}
        onChangeText={setForumSearch}
        style={styles.searchInput}
      />
      {isForumsLoading ? (
        <ActivityIndicator size="large" color="#3498db" />
      ) : (
        <FlatList
          data={filteredForums}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => setSelectedForum(item)}
            >
              <Text style={styles.cardTitle}>{item.name}</Text>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{item.tag}</Text>
              </View>
              <Text style={styles.cardSubtitle}>{item.description}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  <Ionicons name="chatbubble-outline" size={14} />{" "}
                  {item.topicsCount} tópicos
                </Text>
                <Text style={styles.metaText}>
                  <Ionicons name="time-outline" size={14} /> {formatDateAgo(item.createdAt)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );

  const renderTopics = () => (
    <View style={styles.section}>
      <TouchableOpacity onPress={() => setSelectedForum(null)}>
        <Text style={styles.backButton}>← Voltar aos fóruns</Text>
      </TouchableOpacity>
      <Text style={styles.header}>{selectedForum?.name}</Text>
      <TextInput
        placeholder="Buscar tópico..."
        value={topicSearch}
        onChangeText={setTopicSearch}
        style={styles.searchInput}
      />
      {isTopicsLoading ? (
        <ActivityIndicator size="large" color="#3498db" />
      ) : (
        <FlatList
          data={filteredTopics}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => setSelectedTopic(item)}
            >
              <View style={styles.row}>
                <Ionicons name="person-circle-outline" size={32} color="#2c3e50" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.metaText}>
                    {item.author} • {formatDateAgo(item.createdAt)}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardSubtitle}>{item.content}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  <Ionicons name="chatbubbles-outline" size={14} />{" "}
                  {item.repliesCount} respostas
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.placeholder}>Nenhum tópico encontrado.</Text>
          }
        />
      )}
    </View>
  );

  const renderDiscussion = () => {
    return (
      <View style={styles.section}>
        <TouchableOpacity onPress={() => setSelectedTopic(null)}>
          <Text style={styles.backButton}>← Voltar aos tópicos</Text>
        </TouchableOpacity>
        <Text style={styles.header}>{selectedTopic?.title}</Text>
        <Text style={styles.cardSubtitle}>{selectedTopic?.content}</Text>
        
        {isRepliesLoading ? (
          <ActivityIndicator size="large" color="#3498db" style={{ marginTop: 20 }} />
        ) : (
          <ScrollView style={{ marginTop: 10 }}>
            {replies.map((reply: Reply) => (
              <View
                key={reply.id}
                style={[
                  styles.replyCard,
                  reply.accepted ? styles.replyAccepted : null,
                ]}
              >
                <View style={styles.row}>
                  <Ionicons name="person-circle-outline" size={32} color="#2c3e50" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.replyHeader}>{reply.author}</Text>
                    <Text style={styles.metaText}>{formatDateAgo(reply.createdAt)}</Text>
                  </View>
                </View>
                {reply.accepted && (
                  <Text style={styles.acceptedTag}>Resposta aceita</Text>
                )}
                <Text style={styles.replyText}>{reply.text}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {!selectedForum && renderForums()}
      {selectedForum && !selectedTopic && renderTopics()}
      {selectedTopic && renderDiscussion()}
      <Button title="Deslogar" onPress={handleLogout} color="#c0392b" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e9e9e9',
  },
  section: { flex: 1, padding: 16, backgroundColor: "#f7f9fb" },
  header: { fontSize: 20, fontWeight: "600", marginBottom: 12, color: "#2c3e50" },
  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#2c3e50" },
  cardSubtitle: { color: "#555", marginTop: 4 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  metaText: { color: "#7f8c8d", fontSize: 13 },
  backButton: { color: "#3498db", marginBottom: 10 },
  placeholder: {  },
  row: { flexDirection: "row", alignItems: "center" },
  replyCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  replyAccepted: {
    borderColor: "#2ecc71",
    backgroundColor: "#ecfdf5",
  },
  acceptedTag: {
    backgroundColor: "#2ecc71",
    color: "#fff",
    fontSize: 12,
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginVertical: 6,
  },
  replyHeader: { fontWeight: "600", color: "#2c3e50" },
  replyText: { color: "#333", marginVertical: 6 },
  tag: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#eaf1ff",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: { fontSize: 12, color: "#2c6bed", fontWeight: "600" },
});