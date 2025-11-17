import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen } from "lucide-react";

export default function RoleSelection() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Attendance Tracker</h1>
          <p className="text-muted-foreground">Select your role to continue</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="hover-elevate active-elevate-2 cursor-pointer" onClick={() => setLocation("/student")} data-testid="card-student-role">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Student</CardTitle>
              <CardDescription className="text-base">
                View your attendance records and class schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                size="lg"
                data-testid="button-student-login"
              >
                Continue as Student
              </Button>
            </CardContent>
          </Card>

          <Card className="hover-elevate active-elevate-2 cursor-pointer" onClick={() => setLocation("/teacher")} data-testid="card-teacher-role">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Teacher</CardTitle>
              <CardDescription className="text-base">
                Manage classes and track student attendance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                size="lg"
                data-testid="button-teacher-login"
              >
                Continue as Teacher
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
