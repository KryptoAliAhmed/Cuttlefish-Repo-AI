import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Leaf, Users } from "lucide-react"
export type KernelValues = { financial?: number; ecological?: number; social?: number }

export function KernelWeights({ values }: { values?: KernelValues }) {
  const kernels = [
    { name: "Financial", value: Math.max(0, Math.min(100, Math.round((values?.financial ?? 0)))), icon: DollarSign, color: "text-blue-500" },
    { name: "Ecological", value: Math.max(0, Math.min(100, Math.round((values?.ecological ?? 0)))), icon: Leaf, color: "text-green-500" },
    { name: "Social", value: Math.max(0, Math.min(100, Math.round((values?.social ?? 0)))), icon: Users, color: "text-pink-500" },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {kernels.map((kernel) => (
        <Card
          key={kernel.name}
          className="bg-white dark:bg-gray-800/50 shadow-lg hover:shadow-xl transition-shadow duration-300"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">{kernel.name} Kernel</CardTitle>
            <kernel.icon className={`h-5 w-5 ${kernel.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{kernel.value}%</div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-2">
              <div
                className={`bg-gradient-to-r ${
                  kernel.name === "Financial"
                    ? "from-blue-400 to-blue-600"
                    : kernel.name === "Ecological"
                      ? "from-green-400 to-green-600"
                      : "from-pink-400 to-pink-600"
                } h-2.5 rounded-full`}
                style={{ width: `${kernel.value}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
