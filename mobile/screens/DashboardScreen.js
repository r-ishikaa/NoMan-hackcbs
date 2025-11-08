import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';

const DashboardScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [joinedCommunities, setJoinedCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [enrollmentsData, coursesData, communitiesData] = await Promise.all([
        api.getMyEnrollments().catch(() => []),
        api.getCourses().catch(() => []),
        api.getJoinedCommunities().catch(() => []),
      ]);

      setEnrollments(Array.isArray(enrollmentsData) ? enrollmentsData : []);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
      setJoinedCommunities(Array.isArray(communitiesData) ? communitiesData : []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const enrolledCourses = courses.filter((c) =>
    enrollments.some((e) => String(e.courseId) === String(c._id))
  );

  const inProgressCount = enrolledCourses.filter(
    (c) => enrollments.find((e) => String(e.courseId) === String(c._id))?.status === 'enrolled'
  ).length;

  const completedCount = enrolledCourses.filter(
    (c) => enrollments.find((e) => String(e.courseId) === String(c._id))?.status === 'completed'
  ).length;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Hello {user?.username || 'there'}!
        </Text>
        <Text style={styles.subtitle}>Good to see you back</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{inProgressCount}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{completedCount}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{joinedCommunities.length}</Text>
          <Text style={styles.statLabel}>Communities</Text>
        </View>
      </View>

      {/* My Courses */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Courses</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Courses')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {enrolledCourses.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="book" size={48} color="#cccccc" />
            <Text style={styles.emptyText}>No courses enrolled yet</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('Courses')}
            >
              <Text style={styles.emptyButtonText}>Browse Courses</Text>
            </TouchableOpacity>
          </View>
        ) : (
          enrolledCourses.slice(0, 5).map((course) => {
            const enrollment = enrollments.find((e) => String(e.courseId) === String(course._id));
            return (
              <TouchableOpacity
                key={course._id}
                style={styles.courseCard}
                onPress={() => navigation.navigate('CourseDetail', { courseId: course._id })}
              >
                <View style={styles.courseInfo}>
                  <Text style={styles.courseTitle}>{course.title}</Text>
                  <Text style={styles.courseDescription} numberOfLines={2}>
                    {course.description || 'No description'}
                  </Text>
                  <Text style={styles.courseStatus}>
                    Status: {enrollment?.status || 'enrolled'}
                  </Text>
                </View>
                <Icon name="chevron-right" size={24} color="#000000" />
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* My Communities */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Communities</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Communities')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {joinedCommunities.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="group" size={48} color="#cccccc" />
            <Text style={styles.emptyText}>No communities joined yet</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('Communities')}
            >
              <Text style={styles.emptyButtonText}>Explore Communities</Text>
            </TouchableOpacity>
          </View>
        ) : (
          joinedCommunities.slice(0, 5).map((community) => (
            <TouchableOpacity key={community._id} style={styles.communityCard}>
              <View style={styles.communityInfo}>
                <Text style={styles.communityName}>{community.name}</Text>
                <Text style={styles.communityMembers}>
                  {community.memberCount || 0} members
                </Text>
              </View>
              <Icon name="chevron-right" size={24} color="#000000" />
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
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
  header: {
    padding: 24,
    paddingTop: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  seeAll: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },
  courseCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  courseDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  courseStatus: {
    fontSize: 12,
    color: '#999999',
    textTransform: 'capitalize',
  },
  communityCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  communityInfo: {
    flex: 1,
  },
  communityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  communityMembers: {
    fontSize: 14,
    color: '#666666',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
    marginTop: 16,
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DashboardScreen;

