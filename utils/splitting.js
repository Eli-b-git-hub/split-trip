export function calculateSettlements(expenses, users) {
  // 1. Initialize balances for all users at 0
  const balances = {};
  users.forEach(user => balances[user] = 0);

  // 2. Calculate net balance based on specific beneficiaries
  expenses.forEach(expense => {
    const { paidBy, amount, splitWith } = expense;
    
    // Fallback safety: if no one is selected, default to everyone
    const beneficiaries = splitWith && splitWith.length > 0 ? splitWith : users;
    const share = amount / beneficiaries.length;

    // Credit the person who paid the total amount
    balances[paidBy] += amount;

    // Debit only the people who were included in the split
    beneficiaries.forEach(user => {
      balances[user] -= share;
    });
  });

  // 3. Separate into debtors and creditors for the clearing matrix
  let participants = Object.keys(balances).map(user => ({
    user,
    balance: balances[user]
  }));

  const debts = [];
  
  // Greedy algorithm to clear debts efficiently
  while (participants.length > 1) {
    // Sort: largest debtor first, largest creditor last
    participants.sort((a, b) => a.balance - b.balance);

    let debtor = participants[0];
    let creditor = participants[participants.length - 1];

    if (Math.abs(debtor.balance) < 0.01 && Math.abs(creditor.balance) < 0.01) break;

    const amountToSettle = Math.min(Math.abs(debtor.balance), creditor.balance);

    if (amountToSettle > 0.01) {
      debts.push({
        from: debtor.user,
        to: creditor.user,
        amount: Number(amountToSettle.toFixed(2))
      });
    }

    // Update balances
    debtor.balance += amountToSettle;
    creditor.balance -= amountToSettle;

    // Filter out settled participants
    participants = participants.filter(p => Math.abs(p.balance) > 0.01);
  }

  return { balances, debts };
}