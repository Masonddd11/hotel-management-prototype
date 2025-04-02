"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Hotel, BarChart, LogOut } from "lucide-react"
import RoomManagement from "@/components/admin/RoomManagement"
import FacilityManagement from "@/components/admin/FacilityManagement"
import DashboardStats from "@/components/admin/DashboardStats"
import { Button } from "@/components/ui/button"

export default function AdminDashboardPage() {

  const router = useRouter()

  if (!Cookies.get("token")) {
    router.push("/admin/login")
  }

  const [activeTab, setActiveTab] = useState("overview")
  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your hotel details, rooms, and facilities.
          </p>
        </div>
        <div className="flex items-center gap-2 text-2xl font-bold">
          <Hotel className="h-8 w-8 text-primary" />
          <span>Hotel Management System</span>
          <Button variant="outline" onClick={() => {
            Cookies.remove("token")
            router.push("/admin/login")
          }}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="facilities">Facilities</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <DashboardStats />
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[240px] flex items-center justify-center border-2 border-dashed rounded-md">
                  <div className="flex flex-col items-center text-center p-4">
                    <BarChart className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Revenue analytics will appear here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates and activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    "New booking for Room 205 (Deluxe)",
                    "Guest checked in to Room 112",
                    "Room 301 maintenance scheduled",
                    "Sauna facility booking for 2pm",
                    "Guest checkout from Room 118"
                  ].map((activity, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <p>{activity}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="rooms">
          <RoomManagement />
        </TabsContent>
        
        <TabsContent value="facilities">
          <FacilityManagement />
        </TabsContent>
        
        <TabsContent value="bookings">
          <div className="border-2 border-dashed rounded-md p-12 text-center">
            <h3 className="text-xl font-semibold mb-2">Booking Management</h3>
            <p className="text-muted-foreground">Booking management functionality will be implemented here.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
