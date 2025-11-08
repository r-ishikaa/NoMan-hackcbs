import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { api } from '../services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import API_CONFIG from '../config/api';

const { width } = Dimensions.get('window');
const REEL_WIDTH = width / 2 - 24;

const ReelsScreen = () => {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReels();
  }, []);

  const loadReels = async () => {
    try {
      const data = await api.getReels();
      setReels(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading reels:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReels();
  };

  const renderReel = ({ item }) => {
    const thumbnail = item.videoUrl
      ? null
      : item.scenes?.[0]?.imageUrl || null;

    return (
      <TouchableOpacity style={styles.reelCard}>
        <View style={styles.reelThumbnail}>
          {item.videoUrl ? (
            <View style={styles.videoPlaceholder}>
              <Icon name="play-circle-filled" size={48} color="#ffffff" />
            </View>
          ) : thumbnail ? (
            <View style={styles.imagePlaceholder}>
              <Icon name="image" size={32} color="#ffffff" />
            </View>
          ) : (
            <View style={styles.defaultPlaceholder}>
              <Icon name="video-library" size={48} color="#ffffff" />
            </View>
          )}
          
          {/* View count */}
          <View style={styles.viewCount}>
            <Icon name="visibility" size={12} color="#ffffff" />
            <Text style={styles.viewCountText}>
              {item.viewCount > 999 ? `${(item.viewCount / 1000).toFixed(1)}K` : item.viewCount || 0}
            </Text>
          </View>

          {/* Duration */}
          {(item.duration > 0 || item.totalDuration > 0) && (
            <View style={styles.duration}>
              <Text style={styles.durationText}>
                {item.duration > 0 ? `${item.duration}s` : `${item.totalDuration}s`}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.reelTitle} numberOfLines={2}>
          {item.title || 'Untitled Reel'}
        </Text>
        {item.likeCount > 0 && (
          <View style={styles.reelMeta}>
            <Icon name="favorite" size={14} color="#ff4444" />
            <Text style={styles.reelMetaText}>
              {item.likeCount > 999 ? `${(item.likeCount / 1000).toFixed(1)}K` : item.likeCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

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
        data={reels}
        renderItem={renderReel}
        keyExtractor={(item) => item._id || item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="video-library" size={64} color="#cccccc" />
            <Text style={styles.emptyText}>No reels available</Text>
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
  reelCard: {
    width: REEL_WIDTH,
    margin: 8,
    marginBottom: 16,
  },
  reelThumbnail: {
    width: '100%',
    aspectRatio: 9 / 16,
    backgroundColor: '#000000',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  defaultPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  viewCount: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  viewCountText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  duration: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  durationText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  reelTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  reelMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reelMetaText: {
    fontSize: 12,
    color: '#666666',
  },
  emptyState: {
    alignItems: 'center',
    padding: 64,
    width: '100%',
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
    marginTop: 16,
  },
});

export default ReelsScreen;

