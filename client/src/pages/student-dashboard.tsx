import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CheckCircle2, XCircle, Clock, LogOut, Calendar, TrendingUp, GraduationCap } from "lucide-react";
import type { Student, Class, Attendance } from "@shared/schema";

interface AttendanceWithClass extends Attendance {
  class: Class;
}

export default function StudentDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  const { data: students, isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: attendanceRecords, isLoading: attendanceLoading } = useQuery<AttendanceWithClass[]>({
    queryKey: ["/api/attendance/student", selectedStudentId],
    enabled: !!selectedStudentId,
  });

  const { data: currentSession } = useQuery<{ isLoggedIn: boolean; loginTime?: string }>({
    queryKey: ["/api/student/session", selectedStudentId],
    enabled: !!selectedStudentId,
  });

  const loginMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/student/${selectedStudentId}/login`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student/session", selectedStudentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/student", selectedStudentId] });
      toast({
        title: "Logged In",
        description: "Your attendance is now being tracked",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/student/${selectedStudentId}/logout`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student/session", selectedStudentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/student", selectedStudentId] });
      toast({
        title: "Logged Out",
        description: "Your attendance has been recorded",
      });
    },
  });

  const selectedStudent = students?.find(s => s.id.toString() === selectedStudentId);

  const attendanceSummary = attendanceRecords ? {
    total: attendanceRecords.length,
    present: attendanceRecords.filter(a => a.status === "present").length,
    absent: attendanceRecords.filter(a => a.status === "absent").length,
  } : { total: 0, present: 0, absent: 0 };

  const attendancePercentage = attendanceSummary.total > 0 
    ? Math.round((attendanceSummary.present / attendanceSummary.total) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Student Dashboard</h1>
              {selectedStudent && (
                <p className="text-sm text-muted-foreground">Welcome, {selectedStudent.name}</p>
              )}
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

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {!selectedStudentId ? (
          <Card>
            <CardHeader>
              <CardTitle>Select Student Profile</CardTitle>
              <CardDescription>Choose your profile to view attendance records</CardDescription>
            </CardHeader>
            <CardContent>
              {studentsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select onValueChange={setSelectedStudentId} value={selectedStudentId}>
                  <SelectTrigger data-testid="select-student">
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students?.map((student) => (
                      <SelectItem key={student.id} value={student.id.toString()}>
                        {student.name} ({student.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">My Attendance</h2>
                <p className="text-muted-foreground">Track your class attendance and participation</p>
              </div>
              {currentSession?.isLoggedIn ? (
                <Button
                  variant="destructive"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  data-testid="button-logout-session"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out
                </Button>
              ) : (
                <Button
                  onClick={() => loginMutation.mutate()}
                  disabled={loginMutation.isPending}
                  data-testid="button-login-session"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Log In
                </Button>
              )}
            </div>

            {currentSession?.isLoggedIn && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="font-medium">Currently Logged In</span>
                    <span className="text-muted-foreground">
                      since {new Date(currentSession.loginTime!).toLocaleTimeString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" data-testid="text-total-classes">
                    {attendanceSummary.total}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Classes Attended</CardTitle>
                  <CheckCircle2 className="w-4 h-4 text-chart-2" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-chart-2" data-testid="text-classes-attended">
                    {attendanceSummary.present}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" data-testid="text-attendance-rate">
                    {attendancePercentage}%
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Attendance Records</CardTitle>
                <CardDescription>Your class attendance history</CardDescription>
              </CardHeader>
              <CardContent>
                {attendanceLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : attendanceRecords && attendanceRecords.length > 0 ? (
                  <div className="space-y-3">
                    {attendanceRecords.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-4 border rounded-md hover-elevate"
                        data-testid={`attendance-record-${record.id}`}
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">{record.class.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(record.date).toLocaleDateString()} at {record.class.startTime}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {record.class.days.join(", ")}
                          </p>
                        </div>
                        <Badge
                          variant={record.status === "present" ? "default" : "destructive"}
                          data-testid={`badge-status-${record.id}`}
                        >
                          {record.status === "present" ? (
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {record.status === "present" ? "Present" : "Absent"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No attendance records yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Log in during class time to start tracking your attendance
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
