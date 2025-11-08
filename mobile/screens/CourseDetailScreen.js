import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';

const CourseDetailScreen = () => {
  const route = useRoute();
  const { courseId } = route.params;
  const { isAuthenticated } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    loadCourse();
    checkEnrollment();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      const data = await api.getCourse(courseId);
      setCourse(data);
    } catch (error) {
      console.error('Error loading course:', error);
      Alert.alert('Error', 'Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async () => {
    if (!isAuthenticated()) return;
    try {
      const enrollments = await api.getMyEnrollments();
      const isEnrolled = enrollments.some((e) => String(e.courseId) === String(courseId));
      setEnrolled(isEnrolled);
    } catch (error) {
      console.error('Error checking enrollment:', error);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated()) {
      Alert.alert('Login Required', 'Please login to enroll in courses');
      return;
    }

    setEnrolling(true);
    try {
      await api.enrollInCourse(courseId);
      setEnrolled(true);
      Alert.alert('Success', 'Successfully enrolled in course');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to enroll in course');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Course not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{course.title}</Text>
        {(course.institute || course.department) && (
          <Text style={styles.department}>
            {course.institute || course.department}
          </Text>
        )}
      </View>

      <View style={styles.content}>
        {course.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{course.description}</Text>
          </View>
        )}

        <View style={styles.details}>
          {course.professor && (
            <View style={styles.detailItem}>
              <Icon name="person" size={20} color="#000000" />
              <Text style={styles.detailText}>Instructor: {course.professor}</Text>
            </View>
          )}
          {course.duration && (
            <View style={styles.detailItem}>
              <Icon name="schedule" size={20} color="#000000" />
              <Text style={styles.detailText}>Duration: {course.duration}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.enrollButton, enrolled && styles.enrolledButton, enrolling && styles.buttonDisabled]}
          onPress={handleEnroll}
          disabled={enrolled || enrolling}
        >
          <Text style={[styles.enrollButtonText, enrolled && styles.enrolledButtonText]}>
            {enrolling ? 'Enrolling...' : enrolled ? 'Enrolled' : 'Enroll Now'}
          </Text>
        </TouchableOpacity>
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
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  department: {
    fontSize: 16,
    color: '#666666',
  },
  content: {
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
  },
  details: {
    marginBottom: 24,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  detailText: {
    fontSize: 16,
    color: '#000000',
  },
  enrollButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  enrolledButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  enrollButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  enrolledButtonText: {
    color: '#666666',
  },
  errorText: {
    fontSize: 16,
    color: '#999999',
  },
});

export default CourseDetailScreen;

