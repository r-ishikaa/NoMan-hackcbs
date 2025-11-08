import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';

const CoursesScreen = () => {
  const navigation = useNavigation();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [searchQuery, selectedDepartment, courses]);

  const loadCourses = async () => {
    try {
      const data = await api.getCourses();
      setCourses(Array.isArray(data) ? data : []);
      setFilteredCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterCourses = () => {
    let filtered = courses;

    // Filter by department
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(
        (c) => (c.institute || c.department) === selectedDepartment
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title?.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query) ||
          c.professor?.toLowerCase().includes(query) ||
          c.instructor?.toLowerCase().includes(query)
      );
    }

    setFilteredCourses(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCourses();
  };

  const departments = ['all', ...new Set(courses.map((c) => c.institute || c.department).filter(Boolean))];

  const renderCourse = ({ item }) => (
    <TouchableOpacity
      style={styles.courseCard}
      onPress={() => navigation.navigate('CourseDetail', { courseId: item._id })}
    >
      <View style={styles.courseContent}>
        <Text style={styles.courseTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.courseDescription} numberOfLines={2}>
          {item.description || 'No description available'}
        </Text>
        <View style={styles.courseMeta}>
          {item.duration && (
            <View style={styles.metaItem}>
              <Icon name="schedule" size={16} color="#666666" />
              <Text style={styles.metaText}>{item.duration}</Text>
            </View>
          )}
          {item.professor && (
            <View style={styles.metaItem}>
              <Icon name="person" size={16} color="#666666" />
              <Text style={styles.metaText}>{item.professor}</Text>
            </View>
          )}
        </View>
        {(item.institute || item.department) && (
          <Text style={styles.courseDepartment}>
            {item.institute || item.department}
          </Text>
        )}
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
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={20} color="#666666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses..."
            placeholderTextColor="#999999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <FlatList
          horizontal
          data={departments}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.departmentChip,
                selectedDepartment === item && styles.departmentChipActive,
              ]}
              onPress={() => setSelectedDepartment(item)}
            >
              <Text
                style={[
                  styles.departmentChipText,
                  selectedDepartment === item && styles.departmentChipTextActive,
                ]}
              >
                {item === 'all' ? 'All' : item}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.departmentContainer}
        />
      </View>

      <FlatList
        data={filteredCourses}
        renderItem={renderCourse}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="book" size={64} color="#cccccc" />
            <Text style={styles.emptyText}>No courses found</Text>
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
  searchContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#000000',
  },
  departmentContainer: {
    paddingVertical: 4,
  },
  departmentChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  departmentChipActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  departmentChipText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  departmentChipTextActive: {
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
  },
  courseCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseContent: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  courseDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  courseMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#666666',
  },
  courseDepartment: {
    fontSize: 12,
    color: '#999999',
    fontWeight: '500',
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

export default CoursesScreen;

