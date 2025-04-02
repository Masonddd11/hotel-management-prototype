"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, DoorOpen, Dumbbell, Clock } from "lucide-react"
import toast from "react-hot-toast"
import RoomBookingForm from "@/components/guest/RoomBookingForm"
import FacilityBookingForm from "@/components/guest/FacilityBookingForm"
import BookingsList from "@/components/guest/BookingsList"
import Cookies from "js-cookie"

interface Room {
  id: string
  number: string
  type: string
  basePrice: number
  vipDiscount: number | null
  size: number
  capacity: number
  amenities: string[]
  status: string
}

interface Facility {
  id: string
  name: string
  type: string
  basePrice: number
  vipDiscount: number | null
  capacity: number
  description: string | null
  status: string
  operatingHours: Array<{
    dayOfWeek: string
    openTime: string
    closeTime: string
  }>
}

interface Booking {
  id: string
  status: string
}

function DashboardStats({ rooms, facilities }: { rooms: Room[], facilities: Facility[] }) {
  const [activeBookings, setActiveBookings] = useState(0)

  useEffect(() => {
    const fetchActiveBookings = async () => {
      try {
        const guestId = Cookies.get('guestId')
        if (!guestId) return

        const [roomsResponse, facilitiesResponse] = await Promise.all([
          fetch(`/api/bookings?guestId=${guestId}`),
          fetch(`/api/facility-bookings?guestId=${guestId}`)
        ])

        if (!roomsResponse.ok || !facilitiesResponse.ok) return

        const [roomsData, facilitiesData] = await Promise.all([
          roomsResponse.json(),
          facilitiesResponse.json()
        ])

        const activeRoomBookings = roomsData.filter((b: Booking) => b.status === "CONFIRMED").length
        const activeFacilityBookings = facilitiesData.filter((b: Booking) => b.status === "CONFIRMED").length
        setActiveBookings(activeRoomBookings + activeFacilityBookings)
      } catch (error) {
        console.error('Error fetching active bookings:', error)
      }
    }

    fetchActiveBookings()
  }, [])

  const availableRooms = rooms.filter((room) => room.status === "AVAILABLE").length
  const availableFacilities = facilities.filter((facility) => facility.status === "AVAILABLE").length

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Available Rooms</CardTitle>
          <DoorOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{availableRooms}</div>
          <p className="text-xs text-muted-foreground">
            Rooms ready for booking
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Facilities</CardTitle>
          <Dumbbell className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{availableFacilities}</div>
          <p className="text-xs text-muted-foreground">
            Available facilities
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Your Bookings</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeBookings}</div>
          <p className="text-xs text-muted-foreground">
            Active bookings
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function GuestDashboardPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [roomsResponse, facilitiesResponse] = await Promise.all([
        fetch('/api/rooms'),
        fetch('/api/facilities')
      ])

      if (!roomsResponse.ok || !facilitiesResponse.ok) {
        throw new Error('Failed to fetch data')
      }

      const [roomsData, facilitiesData] = await Promise.all([
        roomsResponse.json(),
        facilitiesResponse.json()
      ])

      setRooms(roomsData)
      setFacilities(facilitiesData)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleBookRoom = (room: Room) => {
    setSelectedRoom(room)
  }

  const handleBookFacility = (facility: Facility) => {
    setSelectedFacility(facility)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 px-12 py-5">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Guest Dashboard</h1>
        <Button onClick={() => toast("Profile settings coming soon!")}>
          Profile Settings
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="facilities">Facilities</TabsTrigger>
          <TabsTrigger value="bookings">My Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <DashboardStats rooms={rooms} facilities={facilities} />
        </TabsContent>

        <TabsContent value="rooms" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <Card key={room.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Room {room.number}</span>
                    <Badge variant={room.status === "AVAILABLE" ? "default" : "secondary"}>
                      {room.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <DoorOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {room.type} • {room.size} m²
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        ${room.basePrice}/night
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Up to {room.capacity} guests
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {room.amenities.map((amenity) => (
                        <Badge key={amenity} variant="outline">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <div className="p-4 pt-0">
                  <Button
                    className="w-full"
                    disabled={room.status !== "AVAILABLE"}
                    onClick={() => handleBookRoom(room)}
                  >
                    Book Now
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="facilities" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {facilities.map((facility) => (
              <Card key={facility.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{facility.name}</span>
                    <Badge variant={facility.status === "AVAILABLE" ? "default" : "secondary"}>
                      {facility.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Dumbbell className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {facility.type}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        ${facility.basePrice}/hour
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Up to {facility.capacity} people
                      </span>
                    </div>
                    {facility.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {facility.description}
                      </p>
                    )}
                  </div>
                </CardContent>
                <div className="p-4 pt-0">
                  <Button
                    className="w-full"
                    disabled={facility.status !== "AVAILABLE"}
                    onClick={() => handleBookFacility(facility)}
                  >
                    Book Now
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <BookingsList />
        </TabsContent>
      </Tabs>

      {selectedRoom && (
        <RoomBookingForm
          roomId={selectedRoom.id}
          roomNumber={selectedRoom.number}
          basePrice={selectedRoom.basePrice}
          vipDiscount={selectedRoom.vipDiscount || undefined}
          isOpen={!!selectedRoom}
          onClose={() => {
            setSelectedRoom(null)
          }}
          onSuccess={() => {
            fetchData()
          }}
        />
      )}

      {selectedFacility && (
        <FacilityBookingForm
          facilityId={selectedFacility.id}
          facilityName={selectedFacility.name}
          basePrice={selectedFacility.basePrice}
          vipDiscount={selectedFacility.vipDiscount || undefined}
          isOpen={!!selectedFacility}
          onClose={() => {
            setSelectedFacility(null)
          }}
          onSuccess={() => {
            fetchData()
          }}
        />
      )}
    </div>
  )
} 