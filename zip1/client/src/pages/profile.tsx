import { useEffect, useState } from "react";
import Header from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { toast } = useToast();

  const [isEditMode, setIsEditMode] = useState(true);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [createdAt, setCreatedAt] = useState("");

  const [newSkill, setNewSkill] = useState("");
  const [skills, setSkills] = useState<string[]>([]);

  // Load profile data from localStorage on mount
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const storedBio = localStorage.getItem("bio");
    const storedCreatedAt = localStorage.getItem("createdAt");
    const storedSkills = localStorage.getItem("skills");

    if (storedUsername) setUsername(storedUsername);
    if (storedBio) setBio(storedBio);
    if (storedCreatedAt) setCreatedAt(storedCreatedAt);
    else {
      const now = new Date().toISOString();
      setCreatedAt(now);
      localStorage.setItem("createdAt", now);
    }

    if (storedSkills) setSkills(JSON.parse(storedSkills));
  }, []);

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      const updatedSkills = [...skills, trimmed];
      setSkills(updatedSkills);
      setNewSkill("");
      localStorage.setItem("skills", JSON.stringify(updatedSkills));
    } else {
      toast({ title: "Skill already added or invalid", variant: "destructive" });
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      return toast({ title: "Username cannot be empty", variant: "destructive" });
    }
    localStorage.setItem("username", username);
    localStorage.setItem("bio", bio);
    toast({ title: "Profile saved" });
    setIsEditMode(false);
  };

  return (
    <>
      <Header title="Profile" />
      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            {isEditMode ? (
              <form onSubmit={handleSaveProfile}>
                <Card className="glass border border-white/5">
                  <CardHeader>
                    <CardTitle>Edit Profile</CardTitle>
                    <CardDescription>Enter your information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label htmlFor="username" className="text-sm text-muted">
                        Username
                      </label>
                      <Input
                        id="username"
                        placeholder="Your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label htmlFor="bio" className="text-sm text-muted">
                        Bio
                      </label>
                      <Textarea
                        id="bio"
                        placeholder="Tell us about yourself..."
                        rows={4}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="mt-1 resize-none"
                      />
                    </div>
                    <div>
                      <h3 className="text-sm text-muted">Member Since</h3>
                      <p className="text-sm">
                        {new Date(createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button type="submit" className="gradient-button text-white">
                        Save Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </form>
            ) : (
              <Card className="glass border border-white/5">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Profile</CardTitle>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditMode(true)}
                      className="text-sm"
                    >
                      Edit
                    </Button>
                  </div>
                  <CardDescription>Your information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-center">
                    <div className="w-24 h-24 rounded-full bg-secondary/30 flex items-center justify-center text-2xl text-white font-bold">
                      {username.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm text-muted">Username</h3>
                    <p className="text-lg">{username}</p>
                  </div>
                  <div>
                    <h3 className="text-sm text-muted">Bio</h3>
                    <p className="text-sm">{bio || "No bio added yet."}</p>
                  </div>
                  <div>
                    <h3 className="text-sm text-muted">Member Since</h3>
                    <p className="text-sm">
                      {new Date(createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-2">
            <Tabs defaultValue="skills" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="skills">Skills</TabsTrigger>
                <TabsTrigger value="connections">Connections</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="skills">
                <Card className="glass border border-white/5">
                  <CardHeader>
                    <CardTitle>Add Skill</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddSkill} className="flex space-x-2 mb-4">
                      <Input
                        placeholder="New skill"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                      />
                      <Button type="submit">Add</Button>
                    </form>
                    <ul className="space-y-2">
                      {skills.length > 0 ? (
                        skills.map((skill, i) => (
                          <li key={i} className="px-2 py-1 bg-white/10 rounded">
                            {skill}
                          </li>
                        ))
                      ) : (
                        <p className="text-center text-sm text-muted">
                          No skills added yet.
                        </p>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="connections">
                <Card className="glass border border-white/5">
                  <CardHeader>
                    <CardTitle>Your Connections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>No connections yet.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity">
                <Card className="glass border border-white/5">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>No recent activity.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </>
  );
};

export default Profile;
