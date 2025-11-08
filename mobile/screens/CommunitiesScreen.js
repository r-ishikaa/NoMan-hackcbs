import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { api } from '../services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';

const CommunitiesScreen = () => {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCommunities();
  }, []);

  const loadCommunities = async () => {
    try {
      const data = await api.getCommunities();
      setCommunities(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading communities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCommunities();
  };

  const renderCommunity = ({ item }) => (
    <TouchableOpacity style={styles.communityCard}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.communityImage} />
      ) : (
        <View style={[styles.communityImagePlaceholder, { backgroundColor: item.bgColor || '#9b59b6' }]}>
          <Text style={styles.communityInitial}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.communityInfo}>
        <Text style={styles.communityName}>{item.name}</Text>
        {item.description && (
          <Text style={styles.communityDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View style={styles.communityMeta}>
          <Icon name="people" size={16} color="#666666" />
          <Text style={styles.communityMembers}>
            {item.memberCount || 0} members
          </Text>
        </View>
      </View>
      <Icon name="chevron-right" size={24} color="#000000" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={communities}
        renderItem={renderCommunity}
        keyExtractor={(item) => item._id || item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="group" size={64} color="#cccccc" />
            <Text style={styles.emptyText}>No communities available</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  communityCard: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  communityImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
  },
  communityImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  communityInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  communityInfo: {
    flex: 1,
  },
  communityName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  communityDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  communityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  communityMembers: {
    fontSize: 12,
    color: '#666666',
  },
  emptyState: {
    alignItems: 'center',
    padding: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
    marginTop: 16,
  },
});

export default CommunitiesScreen;

