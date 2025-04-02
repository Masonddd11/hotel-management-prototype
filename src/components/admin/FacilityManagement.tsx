"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea" 
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, Edit, Trash} from "lucide-react"
import toast from "react-hot-toast"

type OperatingHours = {
  id?: string
  dayOfWeek: string
  openTime: string
  closeTime: string
}

type Facility = {
  id: string
  name: string
  type: string
  basePrice: number
  capacity: number
  description: string
  status: string
  hotelId: string
  operatingHours: OperatingHours[]
}

const facilityTypes = ["GYM", "SAUNA", "POOL", "SPA", "CONFERENCE_ROOM", "TENNIS_COURT"]
const facilityStatuses = ["AVAILABLE", "OCCUPIED", "MAINTENANCE", "CLEANING"]
const daysOfWeek = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]

export default function FacilityManagement() {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null)
  
  // Form state
  const [name, setName] = useState("")
  const [type, setType] = useState(facilityTypes[0])
  const [basePrice, setBasePrice] = useState("0")
  const [capacity, setCapacity] = useState("10")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState(facilityStatuses[0])
  const [operatingHours, setOperatingHours] = useState<OperatingHours[]>([])
  
  // Load facilities
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const response = await fetch('/api/facilities')
        const data = await response.json()
        setFacilities(data)
      } catch (error) {
        console.error('Error loading facilities:', error)
        toast.error("Could not load facilities. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    
    fetchFacilities()
  }, [])
  
  const resetForm = () => {
    setName("")
    setType(facilityTypes[0])
    setBasePrice("0")
    setCapacity("10")
    setDescription("")
    setStatus(facilityStatuses[0])
    setOperatingHours([])
    setEditingFacility(null)
  }
  
  const handleOpenForm = (facility?: Facility) => {
    if (facility) {
      setEditingFacility(facility)
      setName(facility.name)
      setType(facility.type)
      setBasePrice(facility.basePrice.toString())
      setCapacity(facility.capacity.toString())
      setDescription(facility.description || "")
      setStatus(facility.status)
      setOperatingHours([...facility.operatingHours])
    } else {
      resetForm()
    }
    setFormOpen(true)
  }
  
  const handleAddOperatingHours = () => {
    setOperatingHours([
      ...operatingHours,
      {
        dayOfWeek: daysOfWeek[0],
        openTime: "09:00",
        closeTime: "17:00"
      }
    ])
  }
  
  const handleUpdateHours = (index: number, field: keyof OperatingHours, value: string) => {
    const updatedHours = [...operatingHours]
    updatedHours[index] = { ...updatedHours[index], [field]: value }
    setOperatingHours(updatedHours)
  }
  
  const handleRemoveHours = (index: number) => {
    setOperatingHours(operatingHours.filter((_, i) => i !== index))
  }
  
  const handleSubmit = async () => {
    try {
      const facilityData = {
        name,
        type,
        basePrice: parseFloat(basePrice),
        capacity: parseInt(capacity),
        description,
        status,
        hotelId: "default-hotel-id", // In a real app, get this from context or config
        operatingHours: operatingHours.map(hours => ({
          dayOfWeek: hours.dayOfWeek,
          openTime: hours.openTime,
          closeTime: hours.closeTime
        }))
      }
      
      const url = editingFacility 
        ? `/api/facilities/${editingFacility.id}` 
        : '/api/facilities'
      
      const method = editingFacility ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(facilityData)
      })
      
      if (!response.ok) throw new Error('Failed to save facility')
      
      const savedFacility = await response.json()
      
      setFacilities(prev => {
        if (editingFacility) {
          return prev.map(f => f.id === editingFacility.id ? savedFacility : f)
        } else {
          return [...prev, savedFacility]
        }
      })
      
      toast.success(`Facility ${editingFacility ? 'updated' : 'added'} successfully.`)
      
      setFormOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error saving facility:', error)
      toast.error("Could not save facility. Please try again.")
    }
  }
  
  const handleDeleteFacility = async (id: string) => {
    if (!confirm("Are you sure you want to delete this facility?")) return
    
    try {
      const response = await fetch(`/api/facilities/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete facility')
      
      setFacilities(prev => prev.filter(facility => facility.id !== id))
      
      toast.success("Facility deleted successfully.")
    } catch (error) {
      console.error('Error deleting facility:', error)
      toast.error("Could not delete facility. Please try again.")
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Facility Management</h2>
        <Button onClick={() => handleOpenForm()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Facility
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Facilities</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">Loading facilities...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Base Price</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facilities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No facilities found. Add a new facility to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  facilities.map(facility => (
                    <TableRow key={facility.id}>
                      <TableCell className="font-medium">{facility.name}</TableCell>
                      <TableCell>{facility.type}</TableCell>
                      <TableCell>${facility.basePrice.toFixed(2)}</TableCell>
                      <TableCell>{facility.capacity}</TableCell>
                      <TableCell>
                        <Badge variant={
                          facility.status === "AVAILABLE" ? "default" : 
                          facility.status === "OCCUPIED" ? "destructive" : 
                          "secondary"
                        }>
                          {facility.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleOpenForm(facility)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDeleteFacility(facility.id)}
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
            <DialogTitle>{editingFacility ? 'Edit Facility' : 'Add New Facility'}</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="details">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="details">Facility Details</TabsTrigger>
              <TabsTrigger value="hours">Operating Hours</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="facility-name">Facility Name</Label>
                  <Input 
                    id="facility-name" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="e.g., Fitness Center" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="facility-type">Facility Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a facility type" />
                    </SelectTrigger>
                    <SelectContent>
                      {facilityTypes.map(type => (
                        <SelectItem key={type} value={type}>{type.replace("_", " ")}</SelectItem>
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
                      {facilityStatuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder="Enter facility description..." 
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="hours" className="space-y-4 pt-4">
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAddOperatingHours}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Operating Hours
                </Button>
              </div>
              
              {operatingHours.length === 0 ? (
                <div className="text-center py-10 border rounded-md">
                  <p className="text-muted-foreground">No operating hours defined yet.</p>
                  <p className="text-muted-foreground text-sm">Add operating hours to specify when this facility is available.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {operatingHours.map((hours, index) => (
                    <div key={index} className="grid grid-cols-4 gap-4 items-end border-b pb-4">
                      <div className="space-y-2">
                        <Label>Day of Week</Label>
                        <Select 
                          value={hours.dayOfWeek} 
                          onValueChange={val => handleUpdateHours(index, 'dayOfWeek', val)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {daysOfWeek.map(day => (
                              <SelectItem key={day} value={day}>{day}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Open Time</Label>
                        <Input 
                          type="time" 
                          value={hours.openTime} 
                          onChange={e => handleUpdateHours(index, 'openTime', e.target.value)} 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Close Time</Label>
                        <Input 
                          type="time" 
                          value={hours.closeTime} 
                          onChange={e => handleUpdateHours(index, 'closeTime', e.target.value)} 
                        />
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => handleRemoveHours(index)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingFacility ? 'Update' : 'Add'} Facility</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 