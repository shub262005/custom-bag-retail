/**
 * Realistic Development Demo Sales Data Seed Script
 *
 * Populates realistic historical Sales across September 2026 for single-store bag retail IMS.
 * Interacts exclusively via the authoritative backend REST API at http://localhost:8080/api/v1.
 *
 * Idempotent: Checks for existing demo sales before running.
 * Run with: node scripts/seedDemoSales.mjs
 */

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080/api/v1';

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} ${res.statusText} on ${url}: ${text}`);
  }
  return res.json();
}

async function main() {
  console.log('--- Starting Demo Sales Seed ---');
  console.log(`Target API: ${BASE_URL}`);

  // 1. Check idempotency: See if demo sales already exist
  const existingSales = await fetchJson(`${BASE_URL}/sales`);
  const demoSalesExisting = existingSales.filter(
    (s) => s.payment?.description && s.payment.description.includes('Demo seed')
  );

  const completedInSep = existingSales.filter(
    (s) => s.status === 'COMPLETED' && s.saleDate?.startsWith('2026-09')
  );

  if (demoSalesExisting.length >= 30 || completedInSep.length >= 35) {
    console.log(
      `✓ Demo sales data is ALREADY SEEDED (${demoSalesExisting.length} demo sales, ${completedInSep.length} completed September sales found).`
    );
    console.log('Skipping seed to prevent duplicate data.');
    return;
  }

  // 2. Fetch existing active products
  const products = await fetchJson(`${BASE_URL}/products`);
  console.log(`Loaded ${products.length} products.`);

  const pMap = {};
  for (const p of products) {
    pMap[p.id] = p;
  }

  // Verify key products exist
  const requiredIds = [1, 2, 3, 4, 5, 6, 7, 8];
  for (const id of requiredIds) {
    if (!pMap[id]) {
      throw new Error(`Required product ID ${id} not found in database.`);
    }
  }

  // 3. Ensure sufficient stock by creating legitimate historical purchases dated 2026-09-01
  console.log('Checking stock levels for demo sales...');
  const purchases = await fetchJson(`${BASE_URL}/purchases`);
  const demoPurchases = purchases.filter((p) => p.notes && p.notes.includes('Demo seed inventory'));

  if (demoPurchases.length === 0) {
    console.log('Seeding prerequisite demo purchases on 2026-09-01 to ensure ample positive stock...');

    // Purchase 1: Metro Bag Wholesalers (supplier 2) - School bags, Laptop bags, Raincoats
    await fetchJson(`${BASE_URL}/purchases`, {
      method: 'POST',
      body: JSON.stringify({
        supplierId: 2,
        purchaseDate: '2026-09-01',
        invoiceNumber: 'INV-DEMO-METRO-0901',
        notes: 'Demo seed inventory replenishment for September retail sales',
        items: [
          { productId: 2, quantity: 35, purchasePrice: 850.0 }, // Skybags Backpack
          { productId: 4, quantity: 30, purchasePrice: 1100.0 }, // Wildcraft Laptop Backpack
          { productId: 3, quantity: 20, purchasePrice: 600.0 }, // All-Weather Raincoat
        ],
        payments: [
          {
            amount: 74750.0,
            paymentMethod: 'BANK_TRANSFER',
            paymentDate: '2026-09-01',
            notes: 'Paid via RTGS',
          },
        ],
      }),
    });
    console.log('✓ Purchase 1 (Metro Bag Wholesalers) created.');

    // Purchase 2: Classic Leather Crafts (supplier 3) - Wallets, Folio cases
    await fetchJson(`${BASE_URL}/purchases`, {
      method: 'POST',
      body: JSON.stringify({
        supplierId: 3,
        purchaseDate: '2026-09-01',
        invoiceNumber: 'INV-DEMO-CLC-0901',
        notes: 'Demo seed inventory replenishment for September retail sales',
        items: [
          { productId: 7, quantity: 40, purchasePrice: 350.0 }, // Classic Leather Wallet
          { productId: 6, quantity: 18, purchasePrice: 1400.0 }, // VIP Folio Case
        ],
        payments: [
          {
            amount: 39200.0,
            paymentMethod: 'CASH',
            paymentDate: '2026-09-01',
            notes: 'Counter payment',
          },
        ],
      }),
    });
    console.log('✓ Purchase 2 (Classic Leather Crafts) created.');

    // Purchase 3: Apex Luggage Distributors (supplier 1) - Cabin bags, Luggage locks, Trolleys
    await fetchJson(`${BASE_URL}/purchases`, {
      method: 'POST',
      body: JSON.stringify({
        supplierId: 1,
        purchaseDate: '2026-09-01',
        invoiceNumber: 'INV-DEMO-APX-0901',
        notes: 'Demo seed inventory replenishment for September retail sales',
        items: [
          { productId: 5, quantity: 20, purchasePrice: 1650.0 }, // Safari Cabin Bag
          { productId: 8, quantity: 45, purchasePrice: 180.0 }, // TSA Lock
          { productId: 1, quantity: 10, purchasePrice: 2200.0 }, // American Tourister Trolley
        ],
        payments: [
          {
            amount: 63100.0,
            paymentMethod: 'BANK_TRANSFER',
            paymentDate: '2026-09-01',
            notes: 'Paid via NEFT',
          },
        ],
      }),
    });
    console.log('✓ Purchase 3 (Apex Luggage Distributors) created.');
  } else {
    console.log('✓ Prerequisite demo purchases already exist.');
  }

  // 4. Define realistic sales plan across September 2026
  // Format:
  // { date, items: [{ productId, quantity, sellingPrice? }], discountPercentage?, discountAmount?, paymentMethod, paymentDescription?, cancelReason?, cancelDesc? }
  const salesPlan = [
    // --- Week 1 ---
    // 2026-09-02 (Wednesday - 2 sales)
    {
      date: '2026-09-02',
      items: [{ productId: 2, quantity: 1 }], // Skybags Backpack ₹1499
      paymentMethod: 'UPI',
      paymentDescription: 'Demo seed: POS terminal UPI',
    },
    {
      date: '2026-09-02',
      items: [
        { productId: 7, quantity: 1 }, // Wallet ₹799
        { productId: 8, quantity: 1 }, // TSA Lock ₹399
      ],
      paymentMethod: 'CASH',
      paymentDescription: 'Demo seed: Counter cash',
    },

    // 2026-09-03 (Thursday - 1 sale)
    {
      date: '2026-09-03',
      items: [{ productId: 4, quantity: 1 }], // Wildcraft Laptop ₹1899
      discountPercentage: 5.0,
      paymentMethod: 'CARD',
      paymentDescription: 'Demo seed: Visa card swipe',
    },

    // 2026-09-04 (Friday - 3 sales)
    {
      date: '2026-09-04',
      items: [
        { productId: 2, quantity: 1 }, // Skybags ₹1499
        { productId: 7, quantity: 1 }, // Wallet ₹799
      ],
      paymentMethod: 'UPI',
      paymentDescription: 'Demo seed: PhonePe',
    },
    {
      date: '2026-09-04',
      items: [{ productId: 1, quantity: 1 }], // American Tourister Trolley ₹3799
      paymentMethod: 'CARD',
      paymentDescription: 'Demo seed: HDFC Credit Card',
    },
    {
      date: '2026-09-04',
      items: [{ productId: 8, quantity: 2 }], // Locks ₹399 ea
      paymentMethod: 'CASH',
      paymentDescription: 'Demo seed: Cash',
    },

    // 2026-09-05 (Saturday - 5 sales - busy weekend)
    {
      date: '2026-09-05',
      items: [{ productId: 2, quantity: 2 }], // Skybags 2x ₹1499
      discountAmount: 100.0,
      paymentMethod: 'UPI',
      paymentDescription: 'Demo seed: Google Pay',
    },
    {
      date: '2026-09-05',
      items: [
        { productId: 5, quantity: 1 }, // Safari Cabin ₹2899
        { productId: 8, quantity: 1 }, // Lock ₹399
      ],
      paymentMethod: 'CARD',
      paymentDescription: 'Demo seed: Master Card',
    },
    {
      date: '2026-09-05',
      items: [{ productId: 7, quantity: 2 }], // Wallets 2x ₹799
      paymentMethod: 'CASH',
      paymentDescription: 'Demo seed: Cash payment',
    },
    {
      date: '2026-09-05',
      items: [{ productId: 3, quantity: 1 }], // Raincoat ₹1199
      paymentMethod: 'UPI',
      paymentDescription: 'Demo seed: Paytm QR',
    },
    {
      date: '2026-09-05',
      items: [{ productId: 6, quantity: 1 }], // VIP Folio ₹2499
      discountPercentage: 10.0,
      paymentMethod: 'BANK_TRANSFER',
      paymentDescription: 'Demo seed: Direct IMPS store transfer',
    },

    // 2026-09-06 (Sunday - 4 sales, 1 cancelled)
    {
      date: '2026-09-06',
      items: [{ productId: 4, quantity: 1 }], // Wildcraft Laptop ₹1899
      paymentMethod: 'UPI',
      paymentDescription: 'Demo seed: UPI QR',
    },
    {
      date: '2026-09-06',
      items: [
        { productId: 2, quantity: 1 },
        { productId: 7, quantity: 1 },
      ],
      paymentMethod: 'CASH',
      paymentDescription: 'Demo seed: Cash counter',
    },
    {
      date: '2026-09-06',
      items: [{ productId: 8, quantity: 3 }],
      paymentMethod: 'UPI',
      paymentDescription: 'Demo seed: PhonePe',
    },
    {
      date: '2026-09-06',
      items: [{ productId: 5, quantity: 1 }], // Safari Cabin
      paymentMethod: 'CASH',
      paymentDescription: 'Demo seed: Cancelled test sale',
      cancelReason: 'WRONG_SALE_ENTRY',
      cancelDesc: 'Customer changed selection before packing',
    },

    // --- Week 2 ---
    // 2026-09-08 (Tuesday - 2 sales)
    {
      date: '2026-09-08',
      items: [{ productId: 7, quantity: 1 }],
      paymentMethod: 'CASH',
      paymentDescription: 'Demo seed: Cash',
    },
    {
      date: '2026-09-08',
      items: [{ productId: 4, quantity: 1 }],
      paymentMethod: 'UPI',
      paymentDescription: 'Demo seed: GPay',
    },

    // 2026-09-09 (Wednesday - 2 sales)
    {
      date: '2026-09-09',
      items: [
        { productId: 2, quantity: 1 },
        { productId: 8, quantity: 1 },
      ],
      paymentMethod: 'UPI',
      paymentDescription: 'Demo seed: BHIM UPI',
    },
    {
      date: '2026-09-09',
      items: [{ productId: 3, quantity: 1 }],
      paymentMethod: 'CASH',
      paymentDescription: 'Demo seed: Cash',
    },

    // 2026-09-10 (Thursday - 3 sales)
    {
      date: '2026-09-10',
      items: [{ productId: 1, quantity: 1, sellingPrice: 3700.0 }], // Slight discount on price
      paymentMethod: 'CARD',
      paymentDescription: 'Demo seed: ICICI Credit Card',
    },
    {
      date: '2026-09-10',
      items: [{ productId: 6, quantity: 1 }],
      paymentMethod: 'OTHER',
      paymentDescription: 'Demo seed: Corporate gift coupon',
    },
    {
      date: '2026-09-10',
      items: [{ productId: 7, quantity: 1 }],
      paymentMethod: 'UPI',
      paymentDescription: 'Demo seed: UPI QR',
    },

    // 2026-09-11 (Friday - 4 sales)
    {
      date: '2026-09-11',
      items: [{ productId: 2, quantity: 2 }],
      discountPercentage: 5.0,
      paymentMethod: 'UPI',
      paymentDescription: 'Demo seed: Google Pay',
    },
    {
      date: '2026-09-11',
      items: [{ productId: 4, quantity: 1 }],
      paymentMethod: 'CASH',
      paymentDescription: 'Demo seed: Cash',
    },
    {
      date: '2026-09-11',
      items: [{ productId: 8, quantity: 2 }],
      paymentMethod: 'UPI',
      paymentDescription: 'Demo seed: Paytm',
    },
    {
      date: '2026-09-11',
      items: [{ productId: 5, quantity: 1 }],
      paymentMethod: 'CARD',
      paymentDescription: 'Demo seed: Debit card',
    },

    // 2026-09-12 (Saturday - 5 sales, 1 cancelled)
    {
      date: '2026-09-12',
      items: [
        { productId: 1, quantity: 1 },
        { productId: 8, quantity: 1 },
      ],
      discountAmount: 200.0,
      paymentMethod: 'CARD',
      paymentDescription: 'Demo seed: SBI Card',
    },
    {
      date: '2026-09-12',
      items: [{ productId: 2, quantity: 1 }],
      paymentMethod: 'UPI',
      paymentDescription: 'Demo seed: PhonePe',
    },
    {
      date: '2026-09-12',
      items: [{ productId: 7, quantity: 2 }],
      paymentMethod: 'CASH',
      paymentDescription: 'Demo seed: Cash',
    },
    {
      date: '2026-09-12',
      items: [{ productId: 3, quantity: 1 }],
      paymentMethod: 'UPI',
      paymentDescription: 'Demo seed: GPay',
    },
    {
      date: '2026-09-12',
      items: [{ productId: 6, quantity: 1 }],
      paymentMethod: 'CASH',
      paymentDescription: 'Demo seed: Cancelled entry',
      cancelReason: 'BILLING_MISTAKE',
      cancelDesc: 'Incorrect billing item selected at checkout',
    },

    // --- Week 3 ---
    // 2026-09-14 (Monday - 1 sale)
    {
      date: '2026-09-14',
      items: [{ productId: 4, quantity: 1 }],
      paymentMethod: 'UPI',
      paymentDescription: 'Demo seed: UPI QR',
    },

    // 2026-09-15 (Tuesday - 2 sales)
    {
      date: '2026-09-15',
      items: [{ productId: 2, quantity: 1 }],
      paymentMethod: 'CASH',
      paymentDescription: 'Demo seed: Cash',
    },
    {
      date: '2026-09-15',
      items: [{ productId: 7, quantity: 1 }],
      paymentMethod: 'UPI',
      paymentDescription: 'Demo seed: Paytm',
    },

    // 2026-09-16 (Wednesday - 3 sales)
    {
      date: '2026-09-16',
      items: [{ productId: 5, quantity: 1 }],
      discountPercentage: 5.0,
      paymentMethod: 'CARD',
      paymentDescription: 'Demo seed: Axis Credit Card',
    },
    {
      date: '2026-09-16',
      items: [{ productId: 8, quantity: 2 }],
      paymentMethod: 'CASH',
      paymentDescription: 'Demo seed: Cash',
    },
    {
      date: '2026-09-16',
      items: [{ productId: 6, quantity: 1 }],
      paymentMethod: 'UPI',
      paymentDescription: 'Demo seed: PhonePe',
    },

    // 2026-09-18 (Friday - 3 sales)
    {
      date: '2026-09-18',
      items: [
        { productId: 2, quantity: 1 },
        { productId: 7, quantity: 1 },
      ],
      paymentMethod: 'UPI',
      paymentDescription: 'Demo seed: Google Pay',
    },
    {
      date: '2026-09-18',
      items: [{ productId: 3, quantity: 1 }],
      paymentMethod: 'CASH',
      paymentDescription: 'Demo seed: Cash',
    },
    {
      date: '2026-09-18',
      items: [{ productId: 4, quantity: 1 }],
      paymentMethod: 'CARD',
      paymentDescription: 'Demo seed: Kotak Debit Card',
    },

    // 2026-09-19 (Saturday - 5 sales, 1 cancelled)
    {
      date: '2026-09-19',
      items: [{ productId: 1, quantity: 1 }],
      discountPercentage: 10.0,
      paymentMethod: 'CARD',
      paymentDescription: 'Demo seed: HDFC Card swipe',
    },
    {
      date: '2026-09-19',
      items: [
        { productId: 2, quantity: 2 },
        { productId: 8, quantity: 1 },
      ],
      paymentMethod: 'UPI',
      paymentDescription: 'Demo seed: PhonePe QR',
    },
    {
      date: '2026-09-19',
      items: [{ productId: 7, quantity: 3 }],
      discountAmount: 150.0,
      paymentMethod: 'CASH',
      paymentDescription: 'Demo seed: Cash bill',
    },
    {
      date: '2026-09-19',
      items: [{ productId: 6, quantity: 1 }],
      paymentMethod: 'BANK_TRANSFER',
      paymentDescription: 'Demo seed: Bank transfer from client account',
    },
    {
      date: '2026-09-19',
      items: [{ productId: 4, quantity: 1 }],
      paymentMethod: 'UPI',
      paymentDescription: 'Demo seed: Returned item test',
      cancelReason: 'CUSTOMER_RETURNED_ITEM',
      cancelDesc: 'Customer returned next day due to color preference',
    },

    // 2026-09-20 (Sunday - 3 sales)
    {
      date: '2026-09-20',
      items: [{ productId: 5, quantity: 1 }],
      paymentMethod: 'CARD',
      paymentDescription: 'Demo seed: Master Card',
    },
    {
      date: '2026-09-20',
      items: [{ productId: 3, quantity: 1 }],
      paymentMethod: 'CASH',
      paymentDescription: 'Demo seed: Cash',
    },
    {
      date: '2026-09-20',
      items: [{ productId: 7, quantity: 1 }],
      paymentMethod: 'UPI',
      paymentDescription: 'Demo seed: Paytm QR',
    },

    // --- Week 4 ---
    // 2026-09-22 (Tuesday - 2 sales)
    {
      date: '2026-09-22',
      items: [{ productId: 2, quantity: 1 }],
      paymentMethod: 'UPI',
      paymentDescription: 'Demo seed: BHIM UPI',
    },
    {
      date: '2026-09-22',
      items: [{ productId: 8, quantity: 2 }],
      paymentMethod: 'CASH',
      paymentDescription: 'Demo seed: Cash',
    },

    // 2026-09-23 (Wednesday - 2 sales)
    {
      date: '2026-09-23',
      items: [{ productId: 4, quantity: 1 }],
      discountPercentage: 5.0,
      paymentMethod: 'UPI',
      paymentDescription: 'Demo seed: Google Pay',
    },
    {
      date: '2026-09-23',
      items: [{ productId: 7, quantity: 1 }],
      paymentMethod: 'CASH',
      paymentDescription: 'Demo seed: Cash counter',
    },

    // 2026-09-24 (Thursday - 2 sales, 1 cancelled)
    {
      date: '2026-09-24',
      items: [{ productId: 6, quantity: 1 }],
      paymentMethod: 'OTHER',
      paymentDescription: 'Demo seed: Store credit voucher',
    },
    {
      date: '2026-09-24',
      items: [{ productId: 2, quantity: 1 }],
      paymentMethod: 'UPI',
      paymentDescription: 'Demo seed: Accidental duplicate billing',
      cancelReason: 'DUPLICATE_SALE',
      cancelDesc: 'Duplicate billing created during internet lag',
    },

    // 2026-09-25 (Friday - 3 sales)
    {
      date: '2026-09-25',
      items: [
        { productId: 1, quantity: 1 },
        { productId: 8, quantity: 1 },
      ],
      paymentMethod: 'CARD',
      paymentDescription: 'Demo seed: Visa card swipe',
    },
    {
      date: '2026-09-25',
      items: [{ productId: 4, quantity: 1 }],
      paymentMethod: 'UPI',
      paymentDescription: 'Demo seed: PhonePe',
    },
    {
      date: '2026-09-25',
      items: [{ productId: 3, quantity: 1 }],
      paymentMethod: 'CASH',
      paymentDescription: 'Demo seed: Cash',
    },

    // 2026-09-26 (Saturday - 4 sales)
    {
      date: '2026-09-26',
      items: [{ productId: 2, quantity: 2 }],
      discountPercentage: 10.0,
      paymentMethod: 'UPI',
      paymentDescription: 'Demo seed: GPay',
    },
    {
      date: '2026-09-26',
      items: [{ productId: 5, quantity: 1 }],
      paymentMethod: 'CARD',
      paymentDescription: 'Demo seed: Debit card',
    },
    {
      date: '2026-09-26',
      items: [{ productId: 7, quantity: 2 }],
      paymentMethod: 'CASH',
      paymentDescription: 'Demo seed: Cash bill',
    },
    {
      date: '2026-09-26',
      items: [{ productId: 8, quantity: 2 }],
      paymentMethod: 'UPI',
      paymentDescription: 'Demo seed: Paytm',
    },

    // 2026-09-27 (Sunday - 2 sales)
    {
      date: '2026-09-27',
      items: [{ productId: 4, quantity: 1 }],
      paymentMethod: 'UPI',
      paymentDescription: 'Demo seed: PhonePe',
    },
    {
      date: '2026-09-27',
      items: [{ productId: 6, quantity: 1 }],
      discountAmount: 100.0,
      paymentMethod: 'CASH',
      paymentDescription: 'Demo seed: Cash',
    },
  ];

  console.log(`Executing sales plan: ${salesPlan.length} total demo sales planned...`);

  let completedCount = 0;
  let cancelledCount = 0;

  for (let i = 0; i < salesPlan.length; i++) {
    const plan = salesPlan[i];

    // Build items with proper default selling prices if omitted
    const items = plan.items.map((it) => {
      const p = pMap[it.productId];
      return {
        productId: it.productId,
        quantity: it.quantity,
        sellingPrice: it.sellingPrice != null ? it.sellingPrice : Number(p.sellingPrice),
      };
    });

    const salePayload = {
      saleDate: plan.date,
      items,
      discountPercentage: plan.discountPercentage || undefined,
      discountAmount: plan.discountAmount || undefined,
      paymentMethod: plan.paymentMethod,
      paymentDescription: plan.paymentDescription,
    };

    // 1. Create sale via normal API
    const createdSale = await fetchJson(`${BASE_URL}/sales`, {
      method: 'POST',
      body: JSON.stringify(salePayload),
    });

    // 2. If it's planned for cancellation, cancel it via the official endpoint
    if (plan.cancelReason) {
      await fetchJson(`${BASE_URL}/sales/${createdSale.id}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({
          reason: plan.cancelReason,
          description: plan.cancelDesc,
        }),
      });
      cancelledCount++;
      console.log(
        `[${i + 1}/${salesPlan.length}] Created & Cancelled Sale ${createdSale.saleNumber} (${plan.date}, Reason: ${plan.cancelReason})`
      );
    } else {
      completedCount++;
      console.log(
        `[${i + 1}/${salesPlan.length}] Created Sale ${createdSale.saleNumber} (${plan.date}, ₹${createdSale.grandTotal}, ${plan.paymentMethod})`
      );
    }
  }

  console.log('\n--- Demo Sales Seed Complete ---');
  console.log(`Completed sales created: ${completedCount}`);
  console.log(`Cancelled sales created: ${cancelledCount}`);
  console.log(`Total demo sales created: ${salesPlan.length}`);
}

main().catch((err) => {
  console.error('Seed script error:', err);
  process.exit(1);
});
