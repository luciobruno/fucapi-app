import api from "@/config/api";
import { useAppDispatch, useAppSelector } from "@/store";
import { clearUser, setUser } from "@/store/authSlice";
import { Forum, Reply, Topic } from "@/types/forum";
import { formatDateAgo } from "@/utils/dateHelper";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function TabTwoScreen() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s: any) => s.auth.user);
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

  const [isForumModalVisible, setIsForumModalVisible] = useState(false);
  const [isTopicModalVisible, setIsTopicModalVisible] = useState(false);
  const [isReplyModalVisible, setIsReplyModalVisible] = useState(false);

  const [currentForum, setCurrentForum] = useState<Partial<Forum> | null>(null);
  const [currentTopic, setCurrentTopic] = useState<Partial<Topic> | null>(null);
  const [currentReply, setCurrentReply] = useState<Partial<Reply> | null>(null);

  const [newReplyText, setNewReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  useEffect(() => {
    const loadUserAndForums = async () => {
      try {
        const raw = await AsyncStorage.getItem("auth_user");
        if (raw) {
          const user = JSON.parse(raw);
          dispatch(setUser(user)); 
        }
      } catch (e) {
        console.error("Erro ao ler o usuário do AsyncStorage", e);
      }

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
    loadUserAndForums();
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
      dispatch(clearUser()); 
      await AsyncStorage.removeItem("auth_user");
      router.replace("/");
    } catch (e) {
      console.error("Erro ao fazer logout:", e);
      Alert.alert("Erro de Logout", "Não foi possível limpar os dados. Tente novamente.");
      router.replace("/");
    }
  };

  const filteredForums = forums.filter(f =>
    f.name.toLowerCase().includes(forumSearch.toLowerCase())
  );

  const filteredTopics = topics.filter((t: any) =>
    t.title.toLowerCase().includes(topicSearch.toLowerCase())
  );

  const handleOpenForumModal = (forum: Forum | null) => {
    if (forum === null && currentUser?.type !== 'professor') {
        Alert.alert("Acesso Negado", "Apenas professores podem criar fóruns.");
        return;
    }
    setCurrentForum(forum ? { ...forum } : { name: "", description: "", tag: "" });
    setIsForumModalVisible(true);
  };

  const handleSaveForum = async () => {
    if (!currentForum?.name || !currentForum?.description || !currentForum?.tag) {
      Alert.alert("Erro", "Preencha todos os campos.");
      return;
    }
    if (currentUser?.type !== 'professor') {
        Alert.alert("Acesso Negado", "Apenas professores podem salvar fóruns.");
        return;
    }
    try {
      if (currentForum.id) {
        const { data } = await api.patch(`forum/${currentForum.id}`, currentForum);
        setForums(forums.map((f) => (f.id === data.id ? data : f)));
      } else {
        const { data } = await api.post('forum/', currentForum);
        setForums([data, ...forums]);
      }
      setIsForumModalVisible(false);
      setCurrentForum(null);
    } catch (e) {
      Alert.alert("Erro", "Não foi possível salvar o fórum.");
    }
  };

  const handleDeleteForum = (forumId: number) => {
    if (currentUser?.type !== 'professor') {
        Alert.alert("Acesso Negado", "Apenas professores podem deletar fóruns.");
        return;
    }
    Alert.alert("Confirmar Exclusão", "Tem certeza que deseja deletar este fórum?", [
      { text: "Cancelar" },
      {
        text: "Deletar",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`forum/${forumId}`);
            setForums(forums.filter((f) => f.id !== forumId));
          } catch (e) {
            Alert.alert("Erro", "Não foi possível deletar o fórum.");
          }
        },
      },
    ]);
  };

  const handleOpenTopicModal = (topic: Topic | null) => {
    if (!currentUser?.type || (topic === null && currentUser.type !== 'professor')) {
        Alert.alert("Acesso Negado", "Apenas professores podem criar tópicos.");
        return;
    }
    
    setCurrentTopic(topic 
        ? { ...topic }
        : { 
            title: "", 
            content: "",
            author: currentUser?.name || 'Usuário Desconhecido'
        }
    );
    setIsTopicModalVisible(true);
  };

  const handleSaveTopic = async () => {
    if (!currentTopic?.title || currentTopic.title.length < 5) {
      Alert.alert("Erro", "O Título é obrigatório e deve ter pelo menos 5 caracteres.");
      return;
    }
    if (!currentTopic?.content || currentTopic.content.length < 10) {
      Alert.alert("Erro", "O Conteúdo é obrigatório e deve ter pelo menos 10 caracteres.");
      return;
    }
    if (!currentTopic?.author || currentTopic.author.length < 3) {
      Alert.alert("Erro", "O Autor é obrigatório e deve ter pelo menos 3 caracteres.");
      return;
    }

    if (currentUser?.type !== 'professor') {
        Alert.alert("Acesso Negado", "Apenas professores podem salvar tópicos.");
        return;
    }

    try {
      const topicBody = {
          title: currentTopic.title,
          content: currentTopic.content,
          author: currentTopic.author,
      };

      if (currentTopic.id) {
        const { data } = await api.patch(`forum/${selectedForum!.id}/topics/${currentTopic.id}`, topicBody);
        setTopics(topics.map((t) => (t.id === data.id ? data : t)));
      } else {
        const { data } = await api.post(`forum/${selectedForum!.id}/topics`, topicBody);
        setTopics([data, ...topics]);
      }
      setIsTopicModalVisible(false);
      setCurrentTopic(null);
    } catch (e) {
      Alert.alert("Erro", "Não foi possível salvar o tópico. Verifique os dados.");
    }
  };

  const handleDeleteTopic = (topicId: number) => {
    if (currentUser?.type !== 'professor') {
        Alert.alert("Acesso Negado", "Apenas professores podem deletar tópicos.");
        return;
    }
    
    Alert.alert("Confirmar Exclusão", "Tem certeza que deseja deletar este tópico?", [
      { text: "Cancelar" },
      {
        text: "Deletar",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`forum/${selectedForum!.id}/topics/${topicId}`);
            setTopics(topics.filter((t) => t.id !== topicId));
          } catch (e) {
            Alert.alert("Erro", "Não foi possível deletar o tópico.");
          }
        },
      },
    ]);
  };

  const handleCreateReply = async () => {
    if (!newReplyText.trim() || newReplyText.trim().length < 5) {
        Alert.alert("Erro", "O texto da resposta é obrigatório e deve ter pelo menos 5 caracteres.");
        return;
    }
    if (!currentUser?.id) {
        Alert.alert("Acesso Negado", "Você precisa estar logado para enviar respostas.");
        return;
    }
    if (!currentUser?.name || currentUser.name.length < 3) {
        Alert.alert("Erro", "Seu nome de autor é inválido. Verifique o login.");
        return;
    }

    setIsSubmittingReply(true);
    try {
        const replyBody = {
            author: currentUser.name,
            text: newReplyText.trim(),
            accepted: false,
        };
        
        const { data } = await api.post(`forum/${selectedForum!.id}/topics/${selectedTopic!.id}/replies`, replyBody);
        
        setReplies([...replies, data]);
        setNewReplyText("");
    } catch (e) {
      Alert.alert("Erro", "Não foi possível enviar a resposta.");
    } finally {
      setIsSubmittingReply(false);
    }
  };
  
  const handleOpenReplyModal = (reply: Reply) => {
    if (currentUser?.id !== reply.authorId) {
        Alert.alert("Acesso Negado", "Você só pode editar suas próprias respostas.");
        return;
    }
    setCurrentReply(reply ? { ...reply } : null);
    setIsReplyModalVisible(true);
  };

  const handleSaveReply = async () => {
    if (!currentReply?.text || currentReply.text.length < 5) {
        Alert.alert("Erro", "O texto da resposta é obrigatório e deve ter pelo menos 5 caracteres.");
        return;
    }
    if (currentUser?.id !== currentReply.authorId) {
        Alert.alert("Acesso Negado", "Você só pode atualizar suas próprias respostas.");
        return;
    }

    try {
        const updateBody = {
            text: currentReply.text,
            accepted: currentReply.accepted,
        };

        const { data } = await api.patch(`forum/${selectedForum!.id}/topics/${selectedTopic!.id}/replies/${currentReply.id}`, updateBody);
        
        setReplies(replies.map((r) => (r.id === data.id ? data : r)));
        setIsReplyModalVisible(false);
        setCurrentReply(null);
    } catch (e) {
      Alert.alert("Erro", "Não foi possível atualizar a resposta.");
    }
  };

  const handleDeleteReply = (replyId: number) => {
    const replyToDelete = replies.find(r => r.id === replyId);
    if (currentUser?.id !== replyToDelete?.authorId) {
        Alert.alert("Acesso Negado", "Você só pode deletar suas próprias respostas.");
        return;
    }

    Alert.alert("Confirmar Exclusão", "Tem certeza que deseja deletar esta resposta?", [
      { text: "Cancelar" },
      {
        text: "Deletar",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`forum/${selectedForum!.id}/topics/${selectedTopic!.id}/replies/${replyId}`);
            setReplies(replies.filter((r) => r.id !== replyId));
          } catch (e) {
            Alert.alert("Erro", "Não foi possível deletar a resposta.");
          }
        },
      },
    ]);
  };
  
  const handleAcceptReply = async (reply: Reply) => {
    if (currentUser?.type !== 'student') {
        Alert.alert("Acesso Negado", "Apenas alunos podem aceitar respostas.");
        return;
    }

    const isCurrentlyAccepted = reply.accepted || false;
    const action = isCurrentlyAccepted ? 'Rejeitar' : 'Aceitar';
    const newAcceptedState = !isCurrentlyAccepted;

    Alert.alert(
      `${action} Resposta`, 
      `Tem certeza que deseja ${action.toLowerCase()} esta resposta?`, 
      [
        { text: "Cancelar" },
        {
          text: action,
          style: newAcceptedState ? 'default' : 'destructive',
          onPress: async () => {
            try {
              const updateBody = { accepted: newAcceptedState };
              
              const { data } = await api.patch(
                `forum/${selectedForum!.id}/topics/${selectedTopic!.id}/replies/${reply.id}`, 
                updateBody
              );
              
              setReplies(replies.map((r) => (r.id === data.id ? data : r)));

            } catch (e) {
              Alert.alert("Erro", `Não foi possível ${action.toLowerCase()} a resposta.`);
            }
          },
        },
      ]);
  };

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
                {/* ALTERAÇÃO: Tempo acima da contagem */}
                <Text style={styles.metaText}>
                  <Ionicons name="time-outline" size={14} /> {formatDateAgo(item.createdAt)}
                </Text>
                <Text style={styles.metaText}>
                  <Ionicons name="chatbubble-outline" size={14} />{" "}
                  {item.topicsCount} tópicos
                </Text>
              </View>
              {currentUser?.type === 'professor' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => handleOpenForumModal(item)}>
                    <Ionicons name="pencil-outline" size={18} color="#3498db" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={() => handleDeleteForum(item.id)}>
                    <Ionicons name="trash-outline" size={18} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              )}
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
                {/* ALTERAÇÃO: Tempo acima da contagem */}
                <Text style={styles.metaText}>
                  <Ionicons name="time-outline" size={14} /> {formatDateAgo(item.createdAt)}
                </Text>
                <Text style={styles.metaText}>
                  <Ionicons name="chatbubbles-outline" size={14} />{" "}
                  {item.repliesCount} respostas
                </Text>
                {currentUser?.type === 'professor' && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleOpenTopicModal(item)}>
                      <Ionicons name="pencil-outline" size={18} color="#3498db" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleDeleteTopic(item.id)}>
                      <Ionicons name="trash-outline" size={18} color="#e74c3c" />
                    </TouchableOpacity>
                  </View>
                )}
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
          <FlatList
            data={replies}
            keyExtractor={(item) => item.id.toString()}
            style={{ marginTop: 10, flex: 1 }}
            renderItem={({ item: reply }) => (
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
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    
                    {currentUser?.type === 'student' && (
                        <TouchableOpacity 
                            style={[styles.actionButton, reply.accepted ? styles.rejectButton : styles.acceptButton]} 
                            onPress={() => handleAcceptReply(reply)}
                        >
                            <Ionicons 
                                name={reply.accepted ? "close-circle-outline" : "checkmark-circle-outline"} 
                                size={22} 
                                color="#fff" 
                            />
                        </TouchableOpacity>
                    )}

                    {currentUser?.id === reply.authorId && (
                      <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.actionButton} onPress={() => handleOpenReplyModal(reply)}>
                          <Ionicons name="pencil-outline" size={18} color="#3498db" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton} onPress={() => handleDeleteReply(reply.id)}>
                          <Ionicons name="trash-outline" size={18} color="#e74c3c" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
                {reply.accepted && (
                  <Text style={styles.acceptedTag}>Resposta aceita</Text>
                )}
                <Text style={styles.replyText}>{reply.text}</Text>
              </View>
            )}
          />
        )}

        {(currentUser?.type === 'professor' || currentUser?.type === 'student') && (
            <View style={styles.replyInputContainer}>
              <TextInput
                style={styles.replyInput}
                placeholder="Escreva sua resposta..."
                value={newReplyText}
                onChangeText={setNewReplyText}
                multiline
              />
              <TouchableOpacity 
                style={styles.replyButton} 
                onPress={handleCreateReply} 
                disabled={isSubmittingReply}
              >
                {isSubmittingReply ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
        )}

      </View>
    );
  };

  const renderFloatingButton = () => {
    let onPressAction = null;
    let iconName: 'add' | 'chatbubbles-outline' = 'add'; 

    if (!selectedForum && currentUser?.type === 'professor') {
      // Criar Fórum
      onPressAction = () => handleOpenForumModal(null);
    } else if (selectedForum && !selectedTopic && currentUser?.type === 'professor') {
      // Criar Tópico
      onPressAction = () => handleOpenTopicModal(null);
    } else if (selectedTopic && (currentUser?.type === 'professor' || currentUser?.type === 'student')) {
      // Criar Resposta (o botão principal seria para rolar para a área de reply, mas vamos usar para focar no input)
      onPressAction = () => {}; // Ação de foco ou rolagem
      iconName = 'chatbubbles-outline';
    }

    if (!onPressAction) return null;

    return (
      <TouchableOpacity 
        style={styles.floatingButton} 
        onPress={onPressAction}
        activeOpacity={0.8}
      >
        <Ionicons name={iconName} size={30} color="#fff" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Container principal ajustado para suportar o padding do FlatList */}
      <View style={{ flex: 1 }}>
        {!selectedForum && renderForums()}
        {selectedForum && !selectedTopic && renderTopics()}
        {selectedTopic && renderDiscussion()}
      </View>
      
      {/* Botão Flutuante */}
      {renderFloatingButton()}
      
      {/* Botão Deslogar no final */}
      <View style={styles.logoutButtonContainer}>
        <Button title="Deslogar" onPress={handleLogout} color="#c0392b" />
      </View>

      {/* Modals ... (Restante do código dos modais) */}
      <Modal
        visible={isForumModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsForumModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {currentForum?.id ? "Editar Fórum" : "Novo Fórum"}
            </Text>
            <TextInput
              placeholder="Nome do Fórum"
              value={currentForum?.name}
              onChangeText={(text) => setCurrentForum({ ...currentForum, name: text })}
              style={styles.modalInput}
            />
            <TextInput
              placeholder="Descrição"
              value={currentForum?.description}
              onChangeText={(text) => setCurrentForum({ ...currentForum, description: text })}
              style={styles.modalInput}
            />
            <TextInput
              placeholder="Tag (ex: GERAL, DEV)"
              value={currentForum?.tag}
              onChangeText={(text) => setCurrentForum({ ...currentForum, tag: text })}
              style={styles.modalInput}
            />
            <View style={styles.modalButtonRow}>
              <Button title="Cancelar" onPress={() => setIsForumModalVisible(false)} color="#7f8c8d" />
              <Button title="Salvar" onPress={handleSaveForum} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isTopicModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsTopicModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {currentTopic?.id ? "Editar Tópico" : "Novo Tópico"}
            </Text>
            <TextInput
              placeholder="Título do Tópico"
              value={currentTopic?.title}
              onChangeText={(text) => setCurrentTopic({ ...currentTopic, title: text, author: currentTopic?.author || currentUser?.name || 'Usuário Desconhecido' })}
              style={styles.modalInput}
            />
            <TextInput
              placeholder="Conteúdo..."
              value={currentTopic?.content}
              onChangeText={(text) => setCurrentTopic({ ...currentTopic, content: text })}
              style={[styles.modalInput, { height: 100 }]}
              multiline
            />
            <View style={styles.modalButtonRow}>
              <Button title="Cancelar" onPress={() => setIsTopicModalVisible(false)} color="#7f8c8d" />
              <Button title="Salvar" onPress={handleSaveTopic} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isReplyModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsReplyModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Resposta</Text>
            <TextInput
              placeholder="Sua resposta..."
              value={currentReply?.text}
              onChangeText={(text) => setCurrentReply({ ...currentReply, text: text })}
              style={[styles.modalInput, { height: 100 }]}
              multiline
            />
            <View style={styles.modalButtonRow}>
              <Button title="Cancelar" onPress={() => setIsReplyModalVisible(false)} color="#7f8c8d" />
              <Button title="Salvar" onPress={handleSaveReply} />
            </View>
          </View>
        </View>
      </Modal>

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
  
  // O headerRow antigo foi removido, pois o botão de adicionar está flutuante.
  // headerRow: { ... }, 

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
  // Ajuste do text wrap (pode ser necessário no Text do cardTitle dependendo do RN)
  cardTitle: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: "#2c3e50",
    flexShrink: 1, // Ajuda no text wrap
  },
  cardSubtitle: { color: "#555", marginTop: 4 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    alignItems: 'center', // Garante alinhamento
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

  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 15,
  },
  actionButton: {
    padding: 4,
    marginLeft: 10,
  },
  acceptButton: {
    backgroundColor: "#2ecc71",
    borderRadius: 20,
    padding: 2,
  },
  rejectButton: {
    backgroundColor: "#e74c3c",
    borderRadius: 20,
    padding: 2,
  },
  replyInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    backgroundColor: '#f7f9fb', // Fundo para destacar a área de input
  },
  replyInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  replyButton: {
    backgroundColor: "#3498db",
    borderRadius: 25,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },

  // ESTILOS NOVOS PARA O BOTÃO FLUTUANTE
  floatingButton: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 80, // Acima do botão Deslogar
    backgroundColor: '#3498db',
    borderRadius: 30,
    elevation: 8, // Sombra para Android
    shadowColor: '#000', // Sombra para iOS
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 5,
    zIndex: 10,
  },
  logoutButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f7f9fb', // Cor de fundo para separar
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  // FIM ESTILOS NOVOS

  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    width: "90%",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
  },
  modalInput: {
    backgroundColor: "#f7f9fb",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    width: "100%",
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
});