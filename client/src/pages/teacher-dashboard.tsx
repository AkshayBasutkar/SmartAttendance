import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Users, LogOut, BookOpen, Clock, Calendar, GraduationCap, CheckSquare, Activity, LogIn } from "lucide-react";
import type { Class, Student, Attendance, LoginLogout } from "@shared/schema";
import { insertClassSchema, insertStudentSchema, insertAttendanceSchema } from "@shared/schema";
import { z } from "zod";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Helper function to format class name as "class01Math", "class02Math", etc.
// Groups classes by base name and numbers them sequentially
const formatClassName = (classItem: Class, allClasses: Class[]): string => {
  // Group classes by their base name
  const sameSubjectClasses = allClasses
    .filter(c => c.name === classItem.name)
    .sort((a, b) => a.id - b.id); // Sort by ID for consistent ordering
  
  // Find the index of this class in the group (1-based)
  const classNumber = sameSubjectClasses.findIndex(c => c.id === classItem.id) + 1;
  
  // Format as class01{name}, class02{name}, etc.
  const paddedNumber = String(classNumber).padStart(2, '0');
  return `class${paddedNumber}${classItem.name}`;
};

interface AttendanceWithStudent extends Attendance {
  student: Student;
}

interface AttendanceWithClass extends Attendance {
  class: Class;
}

interface ActivityRecord extends LoginLogout {
  student: Student;
}

export default function TeacherDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isClassDialogOpen, setIsClassDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [deleteClassId, setDeleteClassId] = useState<number | null>(null);
  const [viewingClassId, setViewingClassId] = useState<number | null>(null);
  
  // Student management state
  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteStudentId, setDeleteStudentId] = useState<number | null>(null);
  
  // Attendance management state
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null);
  const [deleteAttendanceId, setDeleteAttendanceId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("classes");

  const { data: classes, isLoading: classesLoading } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  const { data: students, isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: attendanceRecords, isLoading: attendanceLoading } = useQuery<AttendanceWithStudent[]>({
    queryKey: ["/api/attendance/class", viewingClassId],
    enabled: !!viewingClassId,
  });

  const { data: allAttendance, isLoading: allAttendanceLoading, refetch: refetchAllAttendance } = useQuery<(AttendanceWithStudent & { class?: Class })[]>({
    queryKey: ["/api/attendance/all"],
    enabled: activeTab === "attendance", // Only fetch when attendance tab is active
  });

  const { data: activityRecords, isLoading: activityLoading } = useQuery<ActivityRecord[]>({
    queryKey: ["/api/activity"],
    enabled: activeTab === "activity", // Only fetch when activity tab is active
  });

  const createClassMutation = useMutation({
    mutationFn: (data: z.infer<typeof insertClassSchema>) => 
      apiRequest("POST", "/api/classes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      setIsClassDialogOpen(false);
      setEditingClass(null);
      toast({
        title: "Success",
        description: "Class created successfully",
      });
    },
  });

  const updateClassMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: z.infer<typeof insertClassSchema> }) =>
      apiRequest("PATCH", `/api/classes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      setIsClassDialogOpen(false);
      setEditingClass(null);
      toast({
        title: "Success",
        description: "Class updated successfully",
      });
    },
  });

  const deleteClassMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/classes/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      setDeleteClassId(null);
      toast({
        title: "Success",
        description: "Class deleted successfully",
      });
    },
  });

  // Student mutations
  const createStudentMutation = useMutation({
    mutationFn: (data: z.infer<typeof insertStudentSchema>) =>
      apiRequest("POST", "/api/students", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setIsStudentDialogOpen(false);
      setEditingStudent(null);
      toast({
        title: "Success",
        description: "Student created successfully",
      });
    },
  });

  const updateStudentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: z.infer<typeof insertStudentSchema> }) =>
      apiRequest("PATCH", `/api/students/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setIsStudentDialogOpen(false);
      setEditingStudent(null);
      toast({
        title: "Success",
        description: "Student updated successfully",
      });
    },
  });

  const deleteStudentMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/students/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setDeleteStudentId(null);
      toast({
        title: "Success",
        description: "Student deleted successfully",
      });
    },
  });

  // Attendance mutations
  const createAttendanceMutation = useMutation({
    mutationFn: (data: z.infer<typeof insertAttendanceSchema>) =>
      apiRequest("POST", "/api/attendance", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/class"] });
      setIsAttendanceDialogOpen(false);
      setEditingAttendance(null);
      refetchAllAttendance();
      toast({
        title: "Success",
        description: "Attendance record created successfully",
      });
    },
  });

  const updateAttendanceMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<z.infer<typeof insertAttendanceSchema>> }) =>
      apiRequest("PATCH", `/api/attendance/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/class"] });
      setIsAttendanceDialogOpen(false);
      setEditingAttendance(null);
      refetchAllAttendance();
      toast({
        title: "Success",
        description: "Attendance updated successfully",
      });
    },
  });

  const deleteAttendanceMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/attendance/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/class"] });
      setDeleteAttendanceId(null);
      refetchAllAttendance();
      toast({
        title: "Success",
        description: "Attendance record deleted successfully",
      });
    },
  });

  const classForm = useForm<z.infer<typeof insertClassSchema>>({
    resolver: zodResolver(insertClassSchema),
    defaultValues: {
      name: "",
      startTime: "",
      endTime: "",
      days: [],
    },
  });

  const studentForm = useForm<z.infer<typeof insertStudentSchema>>({
    resolver: zodResolver(insertStudentSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const attendanceForm = useForm<{
    studentId: number;
    classId: number;
    date: string;
    status: string;
    loginLogoutId: number | null;
  }>({
    defaultValues: {
      studentId: 0,
      classId: 0,
      date: new Date().toISOString().slice(0, 16),
      status: "present",
      loginLogoutId: null,
    },
  });

  // Class dialog handlers
  const openCreateClassDialog = () => {
    classForm.reset({
      name: "",
      startTime: "",
      endTime: "",
      days: [],
    });
    setEditingClass(null);
    setIsClassDialogOpen(true);
  };

  const openEditClassDialog = (classItem: Class) => {
    classForm.reset({
      name: classItem.name,
      startTime: classItem.startTime,
      endTime: classItem.endTime,
      days: classItem.days as any,
    });
    setEditingClass(classItem);
    setIsClassDialogOpen(true);
  };

  const handleClassSubmit = (data: z.infer<typeof insertClassSchema>) => {
    if (editingClass) {
      updateClassMutation.mutate({ id: editingClass.id, data });
    } else {
      createClassMutation.mutate(data);
    }
  };

  // Student dialog handlers
  const openCreateStudentDialog = () => {
    studentForm.reset({
      name: "",
      email: "",
      rfidUid: "",
    });
    setEditingStudent(null);
    setIsStudentDialogOpen(true);
  };

  const openEditStudentDialog = (student: Student) => {
    studentForm.reset({
      name: student.name,
      email: student.email,
      rfidUid: student.rfidUid || "",
    });
    setEditingStudent(student);
    setIsStudentDialogOpen(true);
  };

  const handleStudentSubmit = (data: z.infer<typeof insertStudentSchema>) => {
    if (editingStudent) {
      updateStudentMutation.mutate({ id: editingStudent.id, data });
    } else {
      createStudentMutation.mutate(data);
    }
  };

  // Attendance dialog handlers
  const openCreateAttendanceDialog = () => {
    attendanceForm.reset({
      studentId: students?.[0]?.id || 0,
      classId: classes?.[0]?.id || 0,
      date: new Date().toISOString().slice(0, 16),
      status: "present",
      loginLogoutId: null,
    });
    setEditingAttendance(null);
    setIsAttendanceDialogOpen(true);
  };

  const openEditAttendanceDialog = (attendance: AttendanceWithStudent | AttendanceWithClass) => {
    const dateStr = new Date(attendance.date).toISOString().slice(0, 16);
    attendanceForm.reset({
      studentId: attendance.studentId,
      classId: attendance.classId,
      date: dateStr,
      status: attendance.status,
      loginLogoutId: attendance.loginLogoutId || null,
    });
    setEditingAttendance(attendance);
    setIsAttendanceDialogOpen(true);
  };

  const handleAttendanceSubmit = (data: {
    studentId: number;
    classId: number;
    date: string;
    status: string;
    loginLogoutId: number | null;
  }) => {
    // Send date as ISO string - server will convert it to Date
    const submitData = {
      studentId: data.studentId,
      classId: data.classId,
      date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      status: data.status,
      loginLogoutId: data.loginLogoutId || null,
    };
    if (editingAttendance) {
      updateAttendanceMutation.mutate({ 
        id: editingAttendance.id, 
        data: submitData as any // Server accepts string date and converts to Date
      });
    } else {
      createAttendanceMutation.mutate(submitData as any); // Server accepts string date and converts to Date
    }
  };

  const viewingClass = classes?.find(c => c.id === viewingClassId);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Teacher Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage classes and attendance</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setLocation("/")}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Switch Role
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {viewingClassId ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Button
                  variant="ghost"
                  onClick={() => setViewingClassId(null)}
                  className="mb-2"
                  data-testid="button-back-to-classes"
                >
                  ← Back to Classes
                </Button>
                <h2 className="text-2xl font-bold">
                  {viewingClass && classes ? formatClassName(viewingClass, classes) : viewingClass?.name}
                </h2>
                <p className="text-muted-foreground">
                  {viewingClass?.startTime} - {viewingClass?.endTime} • {viewingClass?.days.join(", ")}
                </p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Student Attendance</CardTitle>
                <CardDescription>View and manage attendance for this class</CardDescription>
              </CardHeader>
              <CardContent>
                {attendanceLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : attendanceRecords && attendanceRecords.length > 0 ? (
                  <div className="space-y-3">
                    {attendanceRecords.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-4 border rounded-md"
                        data-testid={`attendance-row-${record.id}`}
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">{record.student.name}</h4>
                          <p className="text-sm text-muted-foreground">{record.student.email}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(record.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={record.status === "present" ? "default" : "destructive"}
                            data-testid={`badge-status-${record.id}`}
                          >
                            {record.status === "present" ? "Present" : "Absent"}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateAttendanceMutation.mutate({
                                id: record.id,
                                data: { status: record.status === "present" ? "absent" : "present" },
                              })
                            }
                            disabled={updateAttendanceMutation.isPending}
                            data-testid={`button-toggle-attendance-${record.id}`}
                          >
                            Toggle
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No attendance records for this class</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 max-w-2xl">
              <TabsTrigger value="classes">
                <BookOpen className="w-4 h-4 mr-2" />
                Classes
              </TabsTrigger>
              <TabsTrigger value="students">
                <GraduationCap className="w-4 h-4 mr-2" />
                Students
              </TabsTrigger>
              <TabsTrigger value="attendance">
                <CheckSquare className="w-4 h-4 mr-2" />
                Attendance
              </TabsTrigger>
              <TabsTrigger value="activity">
                <Activity className="w-4 h-4 mr-2" />
                Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="classes" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">My Classes</h2>
                  <p className="text-muted-foreground">Create and manage your class schedule</p>
                </div>
                <Button
                  onClick={openCreateClassDialog}
                  data-testid="button-create-class"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Class
                </Button>
              </div>

            {classesLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
              </div>
            ) : classes && classes.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {classes.map((classItem) => (
                  <Card key={classItem.id} className="hover-elevate" data-testid={`class-card-${classItem.id}`}>
                    <CardHeader>
                      <CardTitle className="flex items-start justify-between">
                        <span className="line-clamp-1">{classItem.name}</span>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEditClassDialog(classItem)}
                            data-testid={`button-edit-class-${classItem.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteClassId(classItem.id)}
                            data-testid={`button-delete-class-${classItem.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{classItem.startTime} - {classItem.endTime}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div className="flex flex-wrap gap-1">
                          {classItem.days.map((day) => (
                            <Badge key={day} variant="secondary" className="text-xs">
                              {day.slice(0, 3)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        className="w-full mt-4"
                        variant="outline"
                        onClick={() => setViewingClassId(classItem.id)}
                        data-testid={`button-view-attendance-${classItem.id}`}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        View Attendance
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">No classes yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first class to get started
                  </p>
                  <Button onClick={openCreateClassDialog} data-testid="button-create-first-class">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Class
                  </Button>
                </CardContent>
              </Card>
            )}
            </TabsContent>

            <TabsContent value="students" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Students</h2>
                  <p className="text-muted-foreground">Manage student information</p>
                </div>
                <Button onClick={openCreateStudentDialog} data-testid="button-create-student">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Student
                </Button>
              </div>

              {studentsLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                </div>
              ) : students && students.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {students.map((student) => (
                    <Card key={student.id} className="hover-elevate" data-testid={`student-card-${student.id}`}>
                      <CardHeader>
                        <CardTitle className="flex items-start justify-between">
                          <span className="line-clamp-1">{student.name}</span>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEditStudentDialog(student)}
                              data-testid={`button-edit-student-${student.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteStudentId(student.id)}
                              data-testid={`button-delete-student-${student.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{student.email}</span>
                          </div>
                          {student.rfidUid && (
                            <div className="flex items-center gap-2 text-xs">
                              <Badge variant="outline">RFID: {student.rfidUid}</Badge>
                            </div>
                          )}
                          <Badge variant="secondary">{student.role}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <GraduationCap className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">No students yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add your first student to get started
                    </p>
                    <Button onClick={openCreateStudentDialog} data-testid="button-create-first-student">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Student
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="attendance" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Attendance Records</h2>
                  <p className="text-muted-foreground">Manage all attendance records</p>
                </div>
                <Button onClick={openCreateAttendanceDialog} data-testid="button-create-attendance">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Attendance
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>All Attendance Records</CardTitle>
                  <CardDescription>View and manage attendance across all classes</CardDescription>
                </CardHeader>
                <CardContent>
                  {allAttendanceLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : allAttendance && allAttendance.length > 0 ? (
                    <div className="space-y-3">
                      {allAttendance.map((record) => (
                        <div
                          key={record.id}
                          className="flex items-center justify-between p-4 border rounded-md"
                          data-testid={`attendance-record-${record.id}`}
                        >
                          <div className="flex-1">
                            <h4 className="font-medium">{record.student?.name || "Unknown"}</h4>
                            <p className="text-sm text-muted-foreground">
                              {record.student?.email || ""}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(record.date).toLocaleDateString()} • 
                              {record.class && classes ? formatClassName(record.class, classes) : "Class"}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={
                                record.status === "present"
                                  ? "default"
                                  : record.status === "late"
                                  ? "secondary"
                                  : "destructive"
                              }
                              data-testid={`badge-attendance-${record.id}`}
                            >
                              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditAttendanceDialog(record)}
                              data-testid={`button-edit-attendance-${record.id}`}
                            >
                              <Pencil className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDeleteAttendanceId(record.id)}
                              data-testid={`button-delete-attendance-${record.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <CheckSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No attendance records yet</p>
                      <Button
                        onClick={openCreateAttendanceDialog}
                        className="mt-4"
                        data-testid="button-create-first-attendance"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Record
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Student Activity</h2>
                  <p className="text-muted-foreground">View login and logout events</p>
                </div>
              </div>

              {activityLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </div>
              ) : activityRecords && activityRecords.length > 0 ? (
                <div className="space-y-4">
                  {activityRecords.map((record) => {
                    const isLoggedIn = !record.logoutTime;
                    const loginDate = new Date(record.loginTime);
                    const logoutDate = record.logoutTime ? new Date(record.logoutTime) : null;
                    const duration = logoutDate 
                      ? Math.round((logoutDate.getTime() - loginDate.getTime()) / 1000 / 60) // Duration in minutes
                      : null;

                    return (
                      <Card key={record.id} className="hover-elevate">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                              isLoggedIn 
                                ? "bg-green-100 dark:bg-green-900/20" 
                                : "bg-blue-100 dark:bg-blue-900/20"
                            }`}>
                              {isLoggedIn ? (
                                <LogIn className="w-5 h-5 text-green-600 dark:text-green-400" />
                              ) : (
                                <LogOut className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              )}
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{record.student.name}</span>
                                <Badge variant={isLoggedIn ? "default" : "secondary"}>
                                  {isLoggedIn ? "Currently Logged In" : "Logged Out"}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <LogIn className="w-4 h-4" />
                                  <span>Logged in: {loginDate.toLocaleString()}</span>
                                </div>
                                {logoutDate && (
                                  <div className="flex items-center gap-2">
                                    <LogOut className="w-4 h-4" />
                                    <span>Logged out: {logoutDate.toLocaleString()}</span>
                                  </div>
                                )}
                                {duration !== null && (
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>Duration: {duration} minutes</span>
                                  </div>
                                )}
                              </div>
                              {record.student.email && (
                                <p className="text-xs text-muted-foreground">{record.student.email}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Activity className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">No activity yet</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      Student login/logout activity will appear here
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>

      <Dialog open={isClassDialogOpen} onOpenChange={setIsClassDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClass ? "Edit Class" : "Create New Class"}</DialogTitle>
            <DialogDescription>
              {editingClass 
                ? "Update the class details below" 
                : "Fill in the details to create a new class"}
            </DialogDescription>
          </DialogHeader>
          <Form {...classForm}>
            <form onSubmit={classForm.handleSubmit(handleClassSubmit)} className="space-y-4">
              <FormField
                control={classForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Mathematics 101" {...field} data-testid="input-class-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={classForm.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} data-testid="input-start-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={classForm.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} data-testid="input-end-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={classForm.control}
                name="days"
                render={() => (
                  <FormItem>
                    <FormLabel>Days of Week</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <FormField
                          key={day}
                          control={classForm.control}
                          name="days"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(day as any)}
                                  onCheckedChange={(checked) => {
                                    const value = field.value || [];
                                    if (checked) {
                                      field.onChange([...value, day]);
                                    } else {
                                      field.onChange(value.filter((v) => v !== day));
                                    }
                                  }}
                                  data-testid={`checkbox-day-${day.toLowerCase()}`}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                {day}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsClassDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createClassMutation.isPending || updateClassMutation.isPending}
                  data-testid="button-submit-class"
                >
                  {editingClass ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Student Dialog */}
      <Dialog open={isStudentDialogOpen} onOpenChange={setIsStudentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStudent ? "Edit Student" : "Add New Student"}</DialogTitle>
            <DialogDescription>
              {editingStudent 
                ? "Update the student information below" 
                : "Fill in the details to add a new student"}
            </DialogDescription>
          </DialogHeader>
          <Form {...studentForm}>
            <form onSubmit={studentForm.handleSubmit(handleStudentSubmit)} className="space-y-4">
              <FormField
                control={studentForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., John Doe" {...field} data-testid="input-student-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={studentForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="e.g., john@example.com" {...field} data-testid="input-student-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={studentForm.control}
                name="rfidUid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RFID UID (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., 4A 2B 81 3D" 
                        {...field} 
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        data-testid="input-student-rfid" 
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      Scan RFID card and enter the UID here for automatic login/logout
                    </p>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsStudentDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createStudentMutation.isPending || updateStudentMutation.isPending}
                  data-testid="button-submit-student"
                >
                  {editingStudent ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Attendance Dialog */}
      <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAttendance ? "Edit Attendance" : "Add Attendance Record"}</DialogTitle>
            <DialogDescription>
              {editingAttendance 
                ? "Update the attendance record below" 
                : "Fill in the details to add a new attendance record"}
            </DialogDescription>
          </DialogHeader>
          <Form {...attendanceForm}>
            <form onSubmit={attendanceForm.handleSubmit(handleAttendanceSubmit)} className="space-y-4">
              <FormField
                control={attendanceForm.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-attendance-student">
                          <SelectValue placeholder="Select a student" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {students?.map((student) => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {student.name} ({student.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={attendanceForm.control}
                name="classId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-attendance-class">
                          <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classes?.map((classItem) => (
                          <SelectItem key={classItem.id} value={classItem.id.toString()}>
                            {formatClassName(classItem, classes || [])}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={attendanceForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date & Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="datetime-local" 
                        {...field}
                        value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""}
                        onChange={(e) => field.onChange(e.target.value)}
                        data-testid="input-attendance-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={attendanceForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-attendance-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="late">Late</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAttendanceDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createAttendanceMutation.isPending || updateAttendanceMutation.isPending}
                  data-testid="button-submit-attendance"
                >
                  {editingAttendance ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Student Dialog */}
      <AlertDialog open={deleteStudentId !== null} onOpenChange={() => setDeleteStudentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this student? This will also delete all associated attendance and login records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteStudentId && deleteStudentMutation.mutate(deleteStudentId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-student"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Attendance Dialog */}
      <AlertDialog open={deleteAttendanceId !== null} onOpenChange={() => setDeleteAttendanceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attendance Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this attendance record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAttendanceId && deleteAttendanceMutation.mutate(deleteAttendanceId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-attendance"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Class Dialog */}
      <AlertDialog open={deleteClassId !== null} onOpenChange={() => setDeleteClassId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this class? This will also delete all associated attendance records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteClassId && deleteClassMutation.mutate(deleteClassId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-class"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
