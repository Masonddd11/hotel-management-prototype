"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, Clock, CreditCard, CheckCircle } from "lucide-react"
import toast from "react-hot-toast"
import Cookies from "js-cookie"

interface FacilityBookingFormProps {
  facilityId: string
  facilityName: string
  basePrice: number
  vipDiscount?: number
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function FacilityBookingForm({
  facilityId,
  facilityName,
  basePrice,
  vipDiscount,
  isOpen,
  onClose,
  onSuccess,
}: FacilityBookingFormProps) {
  const [date, setDate] = useState<Date>()
  const [startTime, setStartTime] = useState<string>("")
  const [endTime, setEndTime] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || !startTime || !endTime) {
      toast.error("Please select date and time")
      return
    }

    const startDateTime = new Date(date)
    const [startHour, startMinute] = startTime.split(":").map(Number)
    startDateTime.setHours(startHour, startMinute, 0, 0)

    const endDateTime = new Date(date)
    const [endHour, endMinute] = endTime.split(":").map(Number)
    endDateTime.setHours(endHour, endMinute, 0, 0)

    if (startDateTime >= endDateTime) {
      toast.error("End time must be after start time")
      return
    }

    const guestId = Cookies.get('guestId')

    setLoading(true)
    try {
      const response = await fetch("/api/facility-bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          facilityId,
          guestId,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create booking")
      }

      setStep(3) // Move to success step
      setTimeout(() => {
        toast.success("Booking created successfully!")
        onSuccess()
        onClose()
      }, 2000)
    } catch (error) {
      console.error("Error creating booking:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create booking. Please try again.")
      setLoading(false)
    }
  }

  const calculatePrice = () => {
    if (!date || !startTime || !endTime) return basePrice
    const startDateTime = new Date(date)
    const [startHour, startMinute] = startTime.split(":").map(Number)
    startDateTime.setHours(startHour, startMinute, 0, 0)

    const endDateTime = new Date(date)
    const [endHour, endMinute] = endTime.split(":").map(Number)
    endDateTime.setHours(endHour, endMinute, 0, 0)

    const duration = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60)
    let total = basePrice * duration
    if (vipDiscount) {
      total = total * (1 - vipDiscount / 100)
    }
    return total
  }

  const nextStep = () => {
    if (!date || !startTime || !endTime) {
      toast.error("Please select date and time")
      return
    }

    const startDateTime = new Date(date)
    const [startHour, startMinute] = startTime.split(":").map(Number)
    startDateTime.setHours(startHour, startMinute, 0, 0)

    const endDateTime = new Date(date)
    const [endHour, endMinute] = endTime.split(":").map(Number)
    endDateTime.setHours(endHour, endMinute, 0, 0)

    if (startDateTime >= endDateTime) {
      toast.error("End time must be after start time")
      return
    }

    setStep(2)
  }

  const resetForm = () => {
    setDate(undefined)
    setStartTime("")
    setEndTime("")
    setStep(1)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={resetForm}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {step === 1 && `Book ${facilityName}`}
            {step === 2 && "Review & Confirm"}
            {step === 3 && "Booking Confirmed!"}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <form className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg mb-4">
              <h3 className="font-medium mb-2">{facilityName}</h3>
              <p className="text-sm text-muted-foreground mb-1">Base price: ${basePrice} per hour</p>
              {vipDiscount && <p className="text-sm text-green-600">VIP discount: {vipDiscount}% off</p>}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal border-2",
                        !date && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Start Time</Label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">End Time</Label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
            </div>

            <Button
              type="button"
              className="w-full"
              onClick={nextStep}
              disabled={loading}
            >
              Next
            </Button>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">{facilityName}</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {date && format(date, "PPP")}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {startTime} - {endTime}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    ${calculatePrice().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Creating..." : "Confirm Booking"}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <h3 className="text-lg font-medium">Booking Confirmed!</h3>
            <p className="text-sm text-muted-foreground">
              Your facility booking has been created successfully.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 