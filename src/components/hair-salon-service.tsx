'use client'

import { Scissors, Clock, DollarSign } from "lucide-react"

export function HairSalonService() {
  return (
    <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-md overflow-hidden">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-primary/10 rounded-full">
            <Scissors className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Haircut</h2>
        </div>
        <p className="text-gray-600">
          Professional haircut tailored to your style and preferences. Includes wash and style.
        </p>
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span className="text-lg font-semibold text-gray-800">$35</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span className="text-gray-600">45 mins</span>
          </div>
        </div>
      </div>
    </div>
  )
}