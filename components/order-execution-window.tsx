"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Bond, Order } from "@/data/bonds";
import { useToast } from "@/hooks/use-toast";

interface Position {
  id: string;
  bondId: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  realizedPnL: number;
  totalPnL: number;
}

export function OrderExecutionWindow() {
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [selectedBond, setSelectedBond] = useState<Bond | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Order Form State
  const [orderType, setOrderType] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [orderMethod, setOrderMethod] = useState<
    "MARKET" | "LIMIT" | "STOP" | "CONDITIONAL"
  >("MARKET");
  const [disclosedQuantity, setDisclosedQuantity] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [condition, setCondition] = useState("");
  const [useDisclosedQty, setUseDisclosedQty] = useState(false);
  const [useStopLoss, setUseStopLoss] = useState(false);
  const [useConditional, setUseConditional] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bondsData, ordersData, positionsData] = await Promise.all([
        api.getBonds(),
        api.getOrders(),
        api.getPositions(),
      ]);
      setBonds(bondsData);
      setOrders(ordersData);
      setPositions(positionsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  const handleBondSelect = (bondId: string) => {
    const bond = bonds.find((b) => b.id === bondId);
    if (bond) {
      setSelectedBond(bond);
      setPrice(bond.currentPrice.toString());
    }
  };

  const getAvailableQuantity = (bondId: string) => {
    const position = positions.find((p) => p.bondId === bondId);
    return position ? position.quantity : 0;
  };

  const getPositionDetails = (bondId: string) => {
    return positions.find((p) => p.bondId === bondId);
  };

  const calculateOrderValue = () => {
    const qty = Number.parseFloat(quantity) || 0;
    const prc = Number.parseFloat(price) || 0;
    return qty * prc;
  };

  const handleSubmitOrder = async () => {
    if (!selectedBond || !quantity || !price) {
      toast({
        title: "Invalid Order",
        description: "Please select a bond and enter quantity and price",
        variant: "destructive",
      });
      return;
    }

    if (orderType === "SELL") {
      const availableQty = getAvailableQuantity(selectedBond.id);
      const sellQty = Number.parseFloat(quantity);

      if (sellQty > availableQty) {
        toast({
          title: "Insufficient Holdings",
          description: `You only have ${availableQty} bonds available to sell`,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    try {
      const orderData = {
        bondId: selectedBond.id,
        type: orderType,
        quantity: Number.parseFloat(quantity),
        price: Number.parseFloat(price),
        orderType: orderMethod,
        ...(useDisclosedQty &&
          disclosedQuantity && {
            disclosedQuantity: Number.parseFloat(disclosedQuantity),
          }),
        ...(useStopLoss &&
          stopLoss && { stopLoss: Number.parseFloat(stopLoss) }),
        ...(useConditional && condition && { condition }),
      };

      const newOrder = await api.createOrder(orderData);

      setOrders([newOrder, ...orders]);
      fetchData();

      toast({
        title: "Order Submitted",
        description: `${orderType} order for ${quantity} ${selectedBond.ticker} submitted successfully`,
      });

      // Reset form
      setQuantity("");
      setPrice("");
      setDisclosedQuantity("");
      setStopLoss("");
      setCondition("");
      setUseDisclosedQty(false);
      setUseStopLoss(false);
      setUseConditional(false);
    } catch (error) {
      console.error("Order submission failed:", error);
      toast({
        title: "Order Failed",
        description: "Failed to submit order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAvailableBondsForSell = () => {
    return bonds.filter((bond) => {
      const position = positions.find((p) => p.bondId === bond.id);
      return position && position.quantity > 0;
    });
  };

  const getOrderStatusIcon = (status: string) => {
    switch (status) {
      case "EXECUTED":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4 text-red-400" />;
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-400" />;
      default:
        return <Clock className="h-4 w-4 text-blue-400" />;
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "EXECUTED":
        return "bg-green-600";
      case "CANCELLED":
        return "bg-red-600";
      case "PENDING":
        return "bg-yellow-600";
      default:
        return "bg-blue-600";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Order Entry Form */}
      <div className="space-y-6">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-xl text-blue-400">
              New Order Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bond Selection */}
            <div className="space-y-2">
              <Label className="text-slate-300">Select Bond</Label>
              <Select onValueChange={handleBondSelect}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="Choose a bond to trade" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {(orderType === "SELL"
                    ? getAvailableBondsForSell()
                    : bonds
                  ).map((bond) => {
                    const position = getPositionDetails(bond.id);
                    return (
                      <SelectItem key={bond.id} value={bond.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>
                            {bond.ticker} - {bond.issuer}
                            {orderType === "SELL" && position && (
                              <span className="text-green-400 ml-2">
                                ({position.quantity} available)
                              </span>
                            )}
                          </span>
                          <span className="text-slate-400 ml-4">
                            ${bond.currentPrice.toFixed(2)}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedBond && (
              <Card className="bg-slate-800 border-slate-600">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Current Price:</span>
                      <span className="text-white ml-2 font-semibold">
                        ${selectedBond.currentPrice.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">YTM:</span>
                      <span className="text-blue-400 ml-2 font-semibold">
                        {selectedBond.yieldToMaturity.toFixed(2)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Bid:</span>
                      <span className="text-green-400 ml-2">
                        ${selectedBond.bidPrice.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Ask:</span>
                      <span className="text-red-400 ml-2">
                        ${selectedBond.askPrice.toFixed(2)}
                      </span>
                    </div>
                    {orderType === "SELL" && (
                      <>
                        <div>
                          <span className="text-slate-400">Available:</span>
                          <span className="text-green-400 ml-2 font-semibold">
                            {getAvailableQuantity(selectedBond.id)} bonds
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Avg Cost:</span>
                          <span className="text-white ml-2">
                            $
                            {getPositionDetails(
                              selectedBond.id
                            )?.averagePrice.toFixed(2) || "0.00"}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Order Side</Label>
                <Select
                  value={orderType}
                  onValueChange={(value: "BUY" | "SELL") => {
                    setOrderType(value);
                    setSelectedBond(null); // Reset selection when changing order type
                  }}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="BUY">
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 text-green-400 mr-2" />
                        BUY
                      </div>
                    </SelectItem>
                    <SelectItem value="SELL">
                      <div className="flex items-center">
                        <TrendingDown className="h-4 w-4 text-red-400 mr-2" />
                        SELL
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Order Type</Label>
                <Select
                  value={orderMethod}
                  onValueChange={(value: any) => setOrderMethod(value)}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600 text-white">
                    <SelectItem value="MARKET">Market</SelectItem>
                    <SelectItem value="LIMIT">Limit</SelectItem>
                    <SelectItem value="STOP">Stop</SelectItem>
                    <SelectItem value="CONDITIONAL">Conditional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quantity and Price */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">
                  Quantity
                  {orderType === "SELL" && selectedBond && (
                    <span className="text-xs text-slate-400 ml-2">
                      (Max: {getAvailableQuantity(selectedBond.id)})
                    </span>
                  )}
                </Label>
                <Input
                  type="number"
                  placeholder="Enter quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white"
                  max={
                    orderType === "SELL" && selectedBond
                      ? getAvailableQuantity(selectedBond.id)
                      : undefined
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white"
                  disabled={orderMethod === "MARKET"}
                />
              </div>
            </div>

            {/* Order Value */}
            {quantity && price && (
              <div className="bg-slate-800 p-3 rounded border border-slate-600">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total Order Value:</span>
                  <span className="text-white font-semibold text-lg">
                    ${calculateOrderValue().toLocaleString()}
                  </span>
                </div>
                {orderType === "SELL" && selectedBond && (
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-slate-400">Potential P&L:</span>
                    <span
                      className={`font-semibold ${
                        Number.parseFloat(price) -
                          (getPositionDetails(selectedBond.id)?.averagePrice ||
                            0) >=
                        0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      $
                      {(
                        (Number.parseFloat(price) -
                          (getPositionDetails(selectedBond.id)?.averagePrice ||
                            0)) *
                        Number.parseFloat(quantity)
                      ).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <Separator className="bg-slate-600" />

            {/* Advanced Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-300">
                Advanced Options
              </h3>

              {/* Disclosed Quantity */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-slate-300">Disclosed Quantity</Label>
                  <p className="text-xs text-slate-500">
                    Only show partial quantity to market
                  </p>
                </div>
                <Switch
                  checked={useDisclosedQty}
                  onCheckedChange={setUseDisclosedQty}
                />
              </div>

              {useDisclosedQty && (
                <Input
                  type="number"
                  placeholder="Disclosed quantity"
                  value={disclosedQuantity}
                  onChange={(e) => setDisclosedQuantity(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              )}

              {/* Stop Loss */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-slate-300">Stop Loss (Trigger)</Label>
                  <p className="text-xs text-slate-500">
                    Automatic sell trigger price
                  </p>
                </div>
                <Switch
                  checked={useStopLoss}
                  onCheckedChange={setUseStopLoss}
                />
              </div>

              {useStopLoss && (
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Stop loss price"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              )}

              {/* Conditional Orders */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-slate-300">Conditional Order</Label>
                  <p className="text-xs text-slate-500">
                    Execute based on market conditions
                  </p>
                </div>
                <Switch
                  checked={useConditional}
                  onCheckedChange={setUseConditional}
                />
              </div>

              {useConditional && (
                <Textarea
                  placeholder="Enter condition (e.g., 'Execute when 10Y Treasury yield > 4.5%')"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white"
                  rows={3}
                />
              )}
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmitOrder}
              disabled={loading || !selectedBond || !quantity || !price}
              className={`w-full ${
                orderType === "BUY"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              } text-white`}
            >
              {loading ? "Submitting..." : `Submit ${orderType} Order`}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <div className="space-y-6">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-xl text-blue-400">
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  No orders yet
                </div>
              ) : (
                orders.slice(0, 10).map((order) => {
                  const bond = bonds.find((b) => b.id === order.bondId);
                  return (
                    <Card
                      key={order.id}
                      className="bg-slate-800 border-slate-600"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getOrderStatusIcon(order.status)}
                            <Badge
                              className={`${getOrderStatusColor(
                                order.status
                              )} text-white`}
                            >
                              {order.status}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`${
                                order.type === "BUY"
                                  ? "border-green-500 text-green-400"
                                  : "border-red-500 text-red-400"
                              }`}
                            >
                              {order.type}
                            </Badge>
                          </div>
                          <span className="text-xs text-slate-400">
                            {new Date(order.timestamp).toLocaleString()}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-slate-400">Bond:</span>
                            <span className="text-white ml-2">
                              {bond?.ticker || order.bondId}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Quantity:</span>
                            <span className="text-white ml-2">
                              {order.quantity.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Price:</span>
                            <span className="text-white ml-2">
                              ${order.price.toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Type:</span>
                            <span className="text-white ml-2">
                              {order.orderType}
                            </span>
                          </div>
                        </div>

                        {order.disclosedQuantity && (
                          <div className="mt-2 text-xs text-yellow-400">
                            <AlertTriangle className="inline h-3 w-3 mr-1" />
                            Disclosed Qty: {order.disclosedQuantity}
                          </div>
                        )}

                        {order.stopLoss && (
                          <div className="mt-2 text-xs text-red-400">
                            <AlertTriangle className="inline h-3 w-3 mr-1" />
                            Stop Loss: ${order.stopLoss.toFixed(2)}
                          </div>
                        )}

                        {order.condition && (
                          <div className="mt-2 text-xs text-blue-400">
                            <AlertTriangle className="inline h-3 w-3 mr-1" />
                            Condition: {order.condition}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
