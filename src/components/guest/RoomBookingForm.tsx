"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, Users, CreditCard, CheckCircle, AlertCircle } from "lucide-react"
import toast from "react-hot-toast"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import Cookies from "js-cookie"

interface RoomBookingFormProps {
  roomId: string
  roomNumber: string
  basePrice: number
  vipDiscount?: number
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function RoomBookingForm({
  roomId,
  roomNumber,
  basePrice,
  vipDiscount,
  isOpen,
  onClose,
  onSuccess,
}: RoomBookingFormProps) {
  const [checkIn, setCheckIn] = useState<Date>()
  const [checkOut, setCheckOut] = useState<Date>()
  const [guests, setGuests] = useState("1")
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!checkIn || !checkOut) {
      toast.error("Please select check-in and check-out dates")
      return
    }

    if (checkIn >= checkOut) {
      toast.error("Check-out date must be after check-in date")
      return
    }

    const guestId = Cookies.get('guestId')

    setLoading(true)
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId,
          guestId,
          checkIn: checkIn.toISOString(),
          checkOut: checkOut.toISOString(),
          guests: Number.parseInt(guests),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create booking")
      }

      setStep(3) // Move to success step
      setTimeout(() => {
        toast.success("Booking created successfully!")
        onSuccess()
        onClose()
      }, 2000)
    } catch (error) {
      console.error("Error creating booking:", error)
      toast.error("Failed to create booking. Please try again.")
      setLoading(false)
    }
  }

  const calculatePrice = () => {
    if (!checkIn || !checkOut) return basePrice
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    let total = basePrice * nights
    if (vipDiscount) {
      total = total * (1 - vipDiscount / 100)
    }
    return total
  }

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 1
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
  }

  const nextStep = () => {
    if (!checkIn || !checkOut) {
      toast.error("Please select check-in and check-out dates")
      return
    }

    if (checkIn >= checkOut) {
      toast.error("Check-out date must be after check-in date")
      return
    }

    setStep(2)
  }

  const resetForm = () => {
    setCheckIn(undefined)
    setCheckOut(undefined)
    setGuests("1")
    setStep(1)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={resetForm}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {step === 1 && `Book Room ${roomNumber}`}
            {step === 2 && "Review & Confirm"}
            {step === 3 && "Booking Confirmed!"}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <form className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg mb-4">
              <h3 className="font-medium mb-2">Room {roomNumber}</h3>
              <p className="text-sm text-muted-foreground mb-1">Base price: ${basePrice} per night</p>
              {vipDiscount && <p className="text-sm text-green-600">VIP discount: {vipDiscount}% off</p>}
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Check-in Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal border-2",
                          !checkIn && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {checkIn ? format(checkIn, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={checkIn}
                        onSelect={setCheckIn}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Check-out Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal border-2",
                          !checkOut && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {checkOut ? format(checkOut, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={checkOut}
                        onSelect={setCheckOut}
                        initialFocus
                        disabled={(date) => date < (checkIn || new Date())}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Number of Guests</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    className="pl-10 border-2"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" onClick={nextStep}>
                Continue to Review
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="bg-primary/10 p-4">
                <h3 className="font-medium">Booking Summary</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Room {roomNumber}</span>
                  <span className="font-medium">${basePrice}/night</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Check-in</span>
                  <span className="font-medium">{checkIn ? format(checkIn, "PPP") : "-"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Check-out</span>
                  <span className="font-medium">{checkOut ? format(checkOut, "PPP") : "-"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Guests</span>
                  <span className="font-medium">{guests}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Duration</span>
                  <span className="font-medium">
                    {calculateNights()} night{calculateNights() !== 1 ? "s" : ""}
                  </span>
                </div>

                {vipDiscount && (
                  <div className="flex justify-between items-center text-green-600">
                    <span className="text-sm">VIP Discount</span>
                    <span className="font-medium">-{vipDiscount}%</span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between items-center pt-2">
                  <span className="font-medium">Total Price</span>
                  <span className="text-xl font-bold">${calculatePrice().toFixed(2)}</span>
                </div>
              </div>
            </Card>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                Please review your booking details carefully. Once confirmed, cancellations may be subject to our hotel
                policy.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={loading} className="gap-2">
                <CreditCard className="h-4 w-4" />
                {loading ? "Processing..." : "Confirm Booking"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 3 && (
          <div className="py-6 flex flex-col items-center justify-center">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-medium text-center mb-2">Booking Confirmed!</h3>
            <p className="text-center text-muted-foreground mb-6">
              Your reservation for Room {roomNumber} has been successfully created.
            </p>
            <p className="text-center text-sm mb-6">
              Check-in: {checkIn ? format(checkIn, "PPP") : "-"}
              <br />
              Check-out: {checkOut ? format(checkOut, "PPP") : "-"}
              <br />
              Total: ${calculatePrice().toFixed(2)}
            </p>
            <Button onClick={resetForm}>Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

