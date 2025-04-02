"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Edit, Trash } from "lucide-react"
import toast from "react-hot-toast"

type Room = {
  id: string
  number: string
  type: string
  basePrice: number
  vipDiscount?: number
  size: number
  capacity: number
  amenities: string[]
  status: string
  hotelId: string
}

const roomTypes = ["STANDARD", "DELUXE", "SUITE", "PRESIDENTIAL"]
const roomStatuses = ["AVAILABLE", "OCCUPIED", "MAINTENANCE", "CLEANING"]
const commonAmenities = ["Wi-Fi", "TV", "Air Conditioning", "Mini Bar", "Safe", "Room Service", "Balcony"]

export default function RoomManagement() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  
  // Form state
  const [number, setNumber] = useState("")
  const [type, setType] = useState(roomTypes[0])
  const [basePrice, setBasePrice] = useState("0")
  const [vipDiscount, setVipDiscount] = useState("0")
  const [size, setSize] = useState("0")
  const [capacity, setCapacity] = useState("1")
  const [status, setStatus] = useState(roomStatuses[0])
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  
  // Load rooms
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch('/api/rooms')
        if (!response.ok) throw new Error('Failed to fetch rooms')
        const data = await response.json()
        setRooms(data)
      } catch (error) {
        console.error('Error loading rooms:', error)
        toast.error("Could not load rooms. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    
    fetchRooms()
  }, [])
  
  const resetForm = () => {
    setNumber("")
    setType(roomTypes[0])
    setBasePrice("0")
    setVipDiscount("0")
    setSize("0")
    setCapacity("1")
    setStatus(roomStatuses[0])
    setSelectedAmenities([])
    setEditingRoom(null)
  }
  
  const handleOpenForm = (room?: Room) => {
    if (room) {
      setEditingRoom(room)
      setNumber(room.number)
      setType(room.type)
      setBasePrice(room.basePrice.toString())
      setVipDiscount(room.vipDiscount?.toString() || "0")
      setSize(room.size.toString())
      setCapacity(room.capacity.toString())
      setStatus(room.status)
      setSelectedAmenities(room.amenities)
    } else {
      resetForm()
    }
    setFormOpen(true)
  }
  
  const handleAmenityToggle = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity) 
        : [...prev, amenity]
    )
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const roomData = {
        number,
        type,
        basePrice: parseFloat(basePrice),
        vipDiscount: vipDiscount,
        size: parseFloat(size),
        capacity: parseInt(capacity),
        amenities: selectedAmenities,
        status
      }
      
      const url = editingRoom 
        ? `/api/rooms/${editingRoom.id}` 
        : '/api/rooms'
      
      const method = editingRoom ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(roomData)
      })
      
      
      const savedRoom = await response.json()
      
      setRooms(prev => {
        if (editingRoom) {
          return prev.map(r => r.id === editingRoom.id ? savedRoom : r)
        } else {
          return [...prev, savedRoom]
        }
      })
      
      toast.success(`Room ${editingRoom ? 'updated' : 'added'} successfully.`)
      
      setFormOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error saving room:', error)
      toast.error("Could not save room. Please try again.")
    }
  }
  
  const handleDeleteRoom = async (id: string) => {
    if (!confirm("Are you sure you want to delete this room?")) return
    
    try {
      const response = await fetch(`/api/rooms/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete room')
      
      setRooms(prev => prev.filter(room => room.id !== id))
      
      toast.success("Room deleted successfully.")
    } catch (error) {
      console.error('Error deleting room:', error)
      toast.error("Could not delete room. Please try again.")
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Room Management</h2>
        <Button onClick={() => handleOpenForm()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Room
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Rooms</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">Loading rooms...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Base Price</TableHead>
                  <TableHead>VIP Discount</TableHead>
                  <TableHead>Size (m²)</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      No rooms found. Add a new room to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  rooms.map(room => (
                    <TableRow key={room.id}>
                      <TableCell>{room.number}</TableCell>
                      <TableCell>{room.type}</TableCell>
                      <TableCell>${room.basePrice.toFixed(2)}</TableCell>
                      <TableCell>{room.vipDiscount ? `${room.vipDiscount}%` : '-'}</TableCell>
                      <TableCell>{room.size}</TableCell>
                      <TableCell>{room.capacity}</TableCell>
                      <TableCell>
                        <Badge variant={
                          room.status === "AVAILABLE" ? "default" : 
                          room.status === "OCCUPIED" ? "destructive" : 
                          "secondary"
                        }>
                          {room.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleOpenForm(room)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDeleteRoom(room.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingRoom ? 'Edit Room' : 'Add New Room'}</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="room-number">Room Number</Label>
              <Input 
                id="room-number" 
                value={number} 
                onChange={e => setNumber(e.target.value)} 
                placeholder="e.g., 101" 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="room-type">Room Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a room type" />
                </SelectTrigger>
                <SelectContent>
                  {roomTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="base-price">Base Price ($)</Label>
              <Input 
                id="base-price" 
                type="number" 
                value={basePrice} 
                onChange={e => setBasePrice(e.target.value)} 
                min="0" 
                step="0.01" 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vip-discount">VIP Member Discount (%)</Label>
              <Input 
                id="vip-discount" 
                type="number" 
                value={vipDiscount} 
                onChange={e => {
                  const value = parseFloat(e.target.value)
                  if (!isNaN(value) && value >= 0 && value <= 100) {
                    setVipDiscount(value.toString())
                  } else {
                    setVipDiscount("0")
                  }
                }}
                min="0" 
                max="100"
                step="0.1" 
              />
              <p className="text-sm text-muted-foreground">
                Enter the percentage discount for VIP members (0-100)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="size">Size (m²)</Label>
              <Input 
                id="size" 
                type="number" 
                value={size} 
                onChange={e => setSize(e.target.value)} 
                min="0" 
                step="0.1" 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input 
                id="capacity" 
                type="number" 
                value={capacity} 
                onChange={e => setCapacity(e.target.value)} 
                min="1" 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {roomStatuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-2 space-y-2">
              <Label>Amenities</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {commonAmenities.map(amenity => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`amenity-${amenity}`} 
                      checked={selectedAmenities.includes(amenity)}
                      onCheckedChange={() => handleAmenityToggle(amenity)}
                    />
                    <Label htmlFor={`amenity-${amenity}`}>{amenity}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingRoom ? 'Update' : 'Add'} Room</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 