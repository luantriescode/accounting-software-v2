import React, { useEffect, useState } from 'react'
import { Card, CardBody, CardHeader, StatCard, Button } from '../components/ui/index'
import { catalogService, documentService, bankingService } from '../api/client'
import { formatMoney } from '../utils/helpers'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalReceipts: 0,
    totalPayments: 0,
    bankBalance: 0,
    productCount: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      const [receipts, payments, accounts, products] = await Promise.all([
        documentService.getPhieuThu(),
        documentService.getPhieuChi(),
        bankingService.getAccounts(),
        catalogService.getProducts(),
      ])

      const totalReceipts = receipts.reduce((sum, r) => sum + (r.so_tien || 0), 0)
      const totalPayments = payments.reduce((sum, p) => sum + (p.so_tien || 0), 0)
      const bankBalance = accounts.reduce((sum, a) => sum + (a.so_du_hien_tai || 0), 0)

      setStats({
        totalReceipts,
        totalPayments,
        bankBalance,
        productCount: products.length,
      })
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon="💰"
          label="Tổng Thu"
          value={formatMoney(stats.totalReceipts)}
          color="green"
        />
        <StatCard
          icon="💸"
          label="Tổng Chi"
          value={formatMoney(stats.totalPayments)}
          color="red"
        />
        <StatCard
          icon="🏦"
          label="Số Dư NH"
          value={formatMoney(stats.bankBalance)}
          color="blue"
        />
        <StatCard
          icon="📦"
          label="Sản Phẩm"
          value={stats.productCount}
          color="yellow"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold">🚀 Nghiệp Vụ Nhanh</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="primary" className="w-full">
              💰 Phiếu Thu
            </Button>
            <Button variant="outline" className="w-full">
              📥 Nhập Kho
            </Button>
            <Button variant="outline" className="w-full">
              🏦 Thu Tiền Gửi
            </Button>
            <Button variant="outline" className="w-full">
              👥 Thanh Toán Lương
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold">📋 Hoạt Động Gần Đây</h3>
        </CardHeader>
        <CardBody className="text-center text-gray-500 py-12">
          Chọn một danh mục từ menu bên trái để bắt đầu
        </CardBody>
      </Card>
    </div>
  )
}

export default Dashboard