import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc } from '@/lib/firebase';
import { Payment, PaymentStatus, CategoryFeeConfig } from '../models/payment';

class PaymentService {
  private static instance: PaymentService;
  private constructor() {}

  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  async getCategoryFeeConfig(clubId: string, categoryId: string): Promise<CategoryFeeConfig | null> {
    try {
      const configRef = doc(db, `clubs/${clubId}/categoryFees`, categoryId);
      const configSnap = await getDoc(configRef);
      
      if (configSnap.exists()) {
        const data = configSnap.data();
        return {
          id: categoryId,
          categoryId,
          name: data.name || '',
          baseAmount: Number(data.baseAmount) || 0,
          dueDay: Number(data.dueDay) || 10,
          isVariableAmount: Boolean(data.isVariableAmount),
          monthlyFees: Array.isArray(data.monthlyFees) ? data.monthlyFees.map(fee => ({
            month: String(fee.month),
            amount: Number(fee.amount) || 0,
            dueDay: Number(fee.dueDay) || 10,
            description: String(fee.description || '')
          })) : [],
          discounts: {
            siblings: {
              enabled: Boolean(data.discounts?.siblings?.enabled),
              amount: Number(data.discounts?.siblings?.amount) || 0,
              isPercentage: Boolean(data.discounts?.siblings?.isPercentage)
            },
            customDiscounts: Array.isArray(data.discounts?.customDiscounts) ? 
              data.discounts.customDiscounts.map(discount => ({
                id: String(discount.id),
                name: String(discount.name),
                amount: Number(discount.amount) || 0,
                isPercentage: Boolean(discount.isPercentage),
                description: String(discount.description || ''),
                months: Array.isArray(discount.months) ? discount.months.map(String) : []
              })) : []
          },
          players: typeof data.players === 'object' ? Object.entries(data.players).reduce((acc, [key, value]: [string, any]) => ({
            ...acc,
            [key]: {
              active: Boolean(value?.active),
              customAmount: value?.customAmount ? Number(value.customAmount) : null
            }
          }), {}) : {},
          createdAt: String(data.createdAt || new Date().toISOString()),
          updatedAt: String(data.updatedAt || new Date().toISOString())
        } as CategoryFeeConfig;
      }

      // Create default config if none exists
      const categoryRef = doc(db, `clubs/${clubId}/categories`, categoryId);
      const categorySnap = await getDoc(categoryRef);
      if (!categorySnap.exists()) return null;

      const defaultConfig: CategoryFeeConfig = {
        id: categoryId,
        categoryId,
        name: categorySnap.data().name || '',
        baseAmount: 0,
        dueDay: 10,
        isVariableAmount: false,
        monthlyFees: [],
        discounts: {
          siblings: {
            enabled: false,
            amount: 0,
            isPercentage: true
          },
          customDiscounts: []
        },
        players: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(configRef, this.sanitizeConfig(defaultConfig));
      return defaultConfig;
    } catch (error) {
      console.error('Error getting category fee config:', error);
      return null;
    }
  }

  private sanitizeConfig(config: CategoryFeeConfig): any {
    return {
      categoryId: String(config.categoryId),
      name: String(config.name),
      baseAmount: Number(config.baseAmount) || 0,
      dueDay: Number(config.dueDay) || 10,
      isVariableAmount: Boolean(config.isVariableAmount),
      monthlyFees: Array.isArray(config.monthlyFees) ? config.monthlyFees.map(fee => ({
        month: String(fee.month),
        amount: Number(fee.amount) || 0,
        dueDay: Number(fee.dueDay) || config.dueDay,
        description: String(fee.description || '')
      })) : [],
      discounts: {
        siblings: {
          enabled: Boolean(config.discounts?.siblings?.enabled),
          amount: Number(config.discounts?.siblings?.amount) || 0,
          isPercentage: Boolean(config.discounts?.siblings?.isPercentage)
        },
        customDiscounts: Array.isArray(config.discounts?.customDiscounts) ? 
          config.discounts.customDiscounts.map(discount => ({
            id: String(discount.id),
            name: String(discount.name),
            amount: Number(discount.amount) || 0,
            isPercentage: Boolean(discount.isPercentage),
            description: String(discount.description || ''),
            months: Array.isArray(discount.months) ? discount.months.map(String) : []
          })) : []
      },
      players: typeof config.players === 'object' ? Object.entries(config.players).reduce((acc, [key, value]: [string, any]) => ({
        ...acc,
        [key]: {
          active: Boolean(value?.active),
          customAmount: value?.customAmount ? Number(value.customAmount) : null
        }
      }), {}) : {},
      createdAt: String(config.createdAt || new Date().toISOString()),
      updatedAt: new Date().toISOString()
    };
  }

  async saveCategoryFeeConfig(clubId: string, config: CategoryFeeConfig): Promise<void> {
    try {
      if (!config.categoryId || !config.name) {
        throw new Error('Invalid config: missing required fields');
      }

      const sanitizedConfig = this.sanitizeConfig(config);
      const configRef = doc(db, `clubs/${clubId}/categoryFees`, config.categoryId);
      await setDoc(configRef, sanitizedConfig);

      // Regenerate payments for all active players in this category
      const playersRef = collection(db, `clubs/${clubId}/players`);
      const playersQuery = query(playersRef, where('categoryId', '==', config.categoryId));
      const playersSnap = await getDocs(playersQuery);

      for (const playerDoc of playersSnap.docs) {
        if (playerDoc.data().active && sanitizedConfig.players[playerDoc.id]?.active) {
          await this.generatePlayerPayments(clubId, playerDoc.id);
        }
      }
    } catch (error) {
      console.error('Error saving category fee config:', error);
      throw error;
    }
  }

  async generatePlayerPayments(clubId: string, playerId: string): Promise<void> {
    try {
      // Get player data
      const playerDoc = await getDoc(doc(db, `clubs/${clubId}/players`, playerId));
      if (!playerDoc.exists() || !playerDoc.data().active) return;

      const playerData = playerDoc.data();
      
      // Get category fee config
      const config = await this.getCategoryFeeConfig(clubId, playerData.categoryId);
      if (!config) return;

      // Check if player is active in fee config
      if (!config.players[playerId]?.active) return;

      // Get existing payments
      const paymentsRef = collection(db, `clubs/${clubId}/payments`);
      const paymentsQuery = query(paymentsRef, where('playerId', '==', playerId));
      const paymentsSnap = await getDocs(paymentsQuery);
      
      // Delete all pending payments to regenerate them with new amounts
      for (const doc of paymentsSnap.docs) {
        const payment = doc.data() as Payment;
        if (payment.status === PaymentStatus.PENDING || payment.status === PaymentStatus.OVERDUE) {
          await deleteDoc(doc.ref);
        }
      }

      // Generate new payments
      const today = new Date();
      const registrationDate = new Date(playerData.createdAt);
      const payments: Omit<Payment, 'id'>[] = [];

      if (config.isVariableAmount && config.monthlyFees?.length) {
        // Generate payments for configured months
        for (const fee of config.monthlyFees) {
          const dueDate = new Date(fee.month + '-' + fee.dueDay);
          const status = dueDate < today ? PaymentStatus.OVERDUE : PaymentStatus.PENDING;

          let amount = fee.amount;

          // Apply discounts
          if (config.discounts.siblings.enabled) {
            const discount = config.discounts.siblings.isPercentage 
              ? amount * (config.discounts.siblings.amount / 100)
              : config.discounts.siblings.amount;
            amount -= discount;
          }

          const customDiscount = config.discounts.customDiscounts.find(d => d.months.includes(fee.month));
          if (customDiscount) {
            const discount = customDiscount.isPercentage
              ? amount * (customDiscount.amount / 100)
              : customDiscount.amount;
            amount -= discount;
          }

          payments.push({
            playerId,
            playerName: playerData.fullName,
            categoryId: config.categoryId,
            categoryName: config.name,
            amount,
            month: fee.month,
            dueDate: dueDate.toISOString(),
            status,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      } else {
        // Generate monthly payments
        let currentDate = new Date(registrationDate);
        currentDate.setDate(1); // Start from first day of month

        while (currentDate <= today) {
          const month = currentDate.toISOString().slice(0, 7);
          const dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), config.dueDay);
          const status = dueDate < today ? PaymentStatus.OVERDUE : PaymentStatus.PENDING;

          let amount = config.baseAmount;

          // Apply discounts
          if (config.discounts.siblings.enabled) {
            const discount = config.discounts.siblings.isPercentage 
              ? amount * (config.discounts.siblings.amount / 100)
              : config.discounts.siblings.amount;
            amount -= discount;
          }

          const customDiscount = config.discounts.customDiscounts.find(d => d.months.includes(month));
          if (customDiscount) {
            const discount = customDiscount.isPercentage
              ? amount * (customDiscount.amount / 100)
              : customDiscount.amount;
            amount -= discount;
          }

          payments.push({
            playerId,
            playerName: playerData.fullName,
            categoryId: config.categoryId,
            categoryName: config.name,
            amount,
            month,
            dueDate: dueDate.toISOString(),
            status,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });

          currentDate.setMonth(currentDate.getMonth() + 1);
        }
      }

      // Save new payments
      for (const payment of payments) {
        const paymentRef = doc(collection(db, `clubs/${clubId}/payments`));
        await setDoc(paymentRef, payment);
      }
    } catch (error) {
      console.error('Error generating player payments:', error);
      throw error;
    }
  }

  async getMonthlyPayments(clubId: string, month: string): Promise<Payment[]> {
    try {
      const paymentsRef = collection(db, `clubs/${clubId}/payments`);
      const q = query(paymentsRef, where('month', '==', month));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Payment[];
    } catch (error) {
      console.error('Error fetching monthly payments:', error);
      return [];
    }
  }

  async getPlayerPayments(clubId: string, playerId: string): Promise<Payment[]> {
    try {
      // First ensure payments are generated
      await this.generatePlayerPayments(clubId, playerId);

      // Then fetch all payments
      const paymentsRef = collection(db, `clubs/${clubId}/payments`);
      const q = query(paymentsRef, where('playerId', '==', playerId));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Payment[];
    } catch (error) {
      console.error('Error fetching player payments:', error);
      return [];
    }
  }
}

export const paymentService = PaymentService.getInstance();