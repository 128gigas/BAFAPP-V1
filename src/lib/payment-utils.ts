import { collection, query, where, getDocs, addDoc, doc, getDoc } from '@/lib/firebase';
import { db } from '@/lib/firebase';
import { Payment, PaymentStatus, CategoryFeeConfig } from './models/payment';
import { paymentService } from './services/payment-service';

export async function generatePendingPayments(clubId: string, playerId: string): Promise<Payment[]> {
  try {
    // 1. Get player data
    const playerDoc = await getDoc(doc(db, `clubs/${clubId}/players`, playerId));
    if (!playerDoc.exists()) {
      console.log('Player not found:', playerId);
      return [];
    }
    
    const playerData = playerDoc.data();
    if (!playerData.active) {
      console.log('Player is not active:', playerId);
      return [];
    }

    // 2. Get category fee configuration
    const config = await paymentService.getCategoryFeeConfig(clubId, playerData.categoryId);
    if (!config) {
      console.log('No fee configuration found for category:', playerData.categoryId);
      return [];
    }

    // Check if player is active in fee config
    if (!config.players[playerId]?.active) {
      console.log('Player is not active in fee configuration:', playerId);
      return [];
    }

    // 3. Get existing payments
    const paymentsRef = collection(db, `clubs/${clubId}/payments`);
    const paymentsQuery = query(paymentsRef, where('playerId', '==', playerId));
    const paymentsSnapshot = await getDocs(paymentsQuery);
    const existingPayments = new Map(
      paymentsSnapshot.docs.map(doc => [doc.data().month, { id: doc.id, ...doc.data() }])
    );

    // 4. Generate payments based on configuration
    const today = new Date();
    const registrationDate = new Date(playerData.createdAt);
    const payments: Omit<Payment, 'id'>[] = [];

    // Calculate months to generate payments for
    const monthsToGenerate = [];
    let currentDate = new Date(registrationDate);
    currentDate.setDate(1); // Start from first day of month

    while (currentDate <= today) {
      monthsToGenerate.push(currentDate.toISOString().slice(0, 7));
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Generate payments for each month
    for (const month of monthsToGenerate) {
      // Skip if payment already exists
      if (existingPayments.has(month)) continue;

      // Get fee amount for this month
      let amount = config.baseAmount;
      let dueDay = config.dueDay;

      if (config.isVariableAmount && config.monthlyFees) {
        const monthlyFee = config.monthlyFees.find(fee => fee.month === month);
        if (monthlyFee) {
          amount = monthlyFee.amount;
          dueDay = monthlyFee.dueDay;
        }
      }

      // Skip if amount is 0 and it's not a variable fee month
      if (amount === 0 && (!config.isVariableAmount || !config.monthlyFees?.find(fee => fee.month === month))) {
        continue;
      }

      // Apply discounts
      if (config.discounts.siblings.enabled) {
        const discount = config.discounts.siblings.isPercentage 
          ? amount * (config.discounts.siblings.amount / 100)
          : config.discounts.siblings.amount;
        amount -= discount;
      }

      const customDiscount = config.discounts.customDiscounts?.find(d => d.months.includes(month));
      if (customDiscount) {
        const discount = customDiscount.isPercentage
          ? amount * (customDiscount.amount / 100)
          : customDiscount.amount;
        amount -= discount;
      }

      const dueDate = new Date(month + '-' + dueDay);
      const status = dueDate < today ? PaymentStatus.OVERDUE : PaymentStatus.PENDING;

      // Create new payment
      const payment: Omit<Payment, 'id'> = {
        playerId,
        playerName: playerData.fullName,
        categoryId: playerData.categoryId,
        categoryName: config.name,
        amount,
        month,
        dueDate: dueDate.toISOString(),
        status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      payments.push(payment);
    }

    // Save new payments
    const savedPayments: Payment[] = [];
    for (const payment of payments) {
      try {
        const docRef = await addDoc(collection(db, `clubs/${clubId}/payments`), payment);
        savedPayments.push({ id: docRef.id, ...payment });
      } catch (error) {
        console.error('Error saving payment:', error);
      }
    }

    return savedPayments;
  } catch (error) {
    console.error('Error generating pending payments:', error);
    return [];
  }
}