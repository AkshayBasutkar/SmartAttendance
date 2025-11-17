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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Users, LogOut, BookOpen, Clock, Calendar } from "lucide-react";
import type { Class, Student, Attendance } from "@shared/schema";
import { insertClassSchema } from "@shared/schema";
import { z } from "zod";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface AttendanceWithStudent extends Attendance {
  student: Student;
}

export default function TeacherDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isClassDialogOpen, setIsClassDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [deleteClassId, setDeleteClassId] = useState<number | null>(null);
  const [viewingClassId, setViewingClassId] = useState<number | null>(null);

  const { data: classes, isLoading: classesLoading } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  const { data: attendanceRecords, isLoading: attendanceLoading } = useQuery<AttendanceWithStudent[]>({
    queryKey: ["/api/attendance/class", viewingClassId],
    enabled: !!viewingClassId,
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

  const updateAttendanceMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PATCH", `/api/attendance/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/class"] });
      toast({
        title: "Success",
        description: "Attendance updated successfully",
      });
    },
  });

  const form = useForm<z.infer<typeof insertClassSchema>>({
    resolver: zodResolver(insertClassSchema),
    defaultValues: {
      name: "",
      startTime: "",
      endTime: "",
      days: [],
    },
  });

  const openCreateDialog = () => {
    form.reset({
      name: "",
      startTime: "",
      endTime: "",
      days: [],
    });
    setEditingClass(null);
    setIsClassDialogOpen(true);
  };

  const openEditDialog = (classItem: Class) => {
    form.reset({
      name: classItem.name,
      startTime: classItem.startTime,
      endTime: classItem.endTime,
      days: classItem.days as any,
    });
    setEditingClass(classItem);
    setIsClassDialogOpen(true);
  };

  const handleSubmit = (data: z.infer<typeof insertClassSchema>) => {
    if (editingClass) {
      updateClassMutation.mutate({ id: editingClass.id, data });
    } else {
      createClassMutation.mutate(data);
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
                <h2 className="text-2xl font-bold">{viewingClass?.name}</h2>
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
                                status: record.status === "present" ? "absent" : "present",
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
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">My Classes</h2>
                <p className="text-muted-foreground">Create and manage your class schedule</p>
              </div>
              <Button
                onClick={openCreateDialog}
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
                            onClick={() => openEditDialog(classItem)}
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
                  <Button onClick={openCreateDialog} data-testid="button-create-first-class">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Class
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
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
                  control={form.control}
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
                  control={form.control}
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
                control={form.control}
                name="days"
                render={() => (
                  <FormItem>
                    <FormLabel>Days of Week</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <FormField
                          key={day}
                          control={form.control}
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
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
