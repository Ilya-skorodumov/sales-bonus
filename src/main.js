/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // purchase — это одна из записей в поле items из чека в data.purchase_records
   // _product — это продукт из коллекции data.products
   const { discount, sale_price, quantity } = purchase;
   const discProc = 1 - (discount / 100);
   return sale_price * quantity * discProc
   // @TODO: Расчет выручки от операции
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    const { profit } = seller;
    if (index == 0) {
    return 0.15 * profit;
} else if (index > 3) {
    return 0.1 * profit;
} else if (index == (total - 1)) {
    return 0 * profit;
} else { // Для всех остальных
    return 0.05 * profit;
} 
    // @TODO: Расчет бонуса от позиции в рейтинге
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    const { calculateRevenue, calculateBonus } = options;
    if (!data
    || !Array.isArray(data.sellers)
    || data.sellers.length === 0
) {
    throw new Error('Некорректные входные данные');
} 

    // @TODO: Проверка наличия опций
    if (!typeof calculateRevenue === "function" || !typeof options === "object") {
    throw new Error('Чего-то не хватает');
}

    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(seller => ({
        id: seller.id, // Идентификатор продавца
        name: `${seller.first_name} ${seller.last_name}`,// Имя и фамилия продавца
        revenue: 0, // Общая выручка с учётом скидок
        profit: 0, // Прибыль от продаж продавца
        sales_count: 0,// Количество продаж
    products_sold: {}
}));

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = sellerStats.reduce((result, item) => ({
    ...result,
    [item["id"]]: item
}), {}); // Ключом будет id, значением — запись из sellerStats
const productIndex = data["products"].reduce((result, item) => ({
    ...result,
    [item["sku"]]: item
}), {}); // Ключом будет sku, значением — запись из data.products

    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => { // Чек
        const seller = sellerIndex[record.seller_id]; // Продавец
        seller.sales_count += 1; // Увеличить количество продаж
        seller.revenue += record.total_amount; // Увеличить общую сумму выручки всех продаж

        // Расчёт прибыли для каждого товара
        record.items.forEach(item => {
            const product = productIndex[item.sku]; // Товар
            let cost = product.purchase_price * item.quantity; // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
            let revenue = calculateSimpleRevenue(item); // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
            let profit = revenue - cost; // Посчитать прибыль: выручка минус себестоимость
            seller.profit += profit// Увеличить общую накопленную прибыль (profit) у продавца

            // Учёт количества проданных товаров
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
                seller.products_sold[item.sku]+= 1 * item.quantity;
            }
             else {
                   seller.products_sold[item.sku]+= 1 * item.quantity;
            }
            // По артикулу товара увеличить его проданное количество у продавца
        });
 });


    // @TODO: Сортировка продавцов по прибыли
    sellerStats.sort((a,b)=> {
      if (a.profit > b.profit){
      return -1;
      }
      if (a.profit < b.profit){
      return 1;
      }
      return 0;
});

    // @TODO: Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonusByProfit(index, sellerStats.length,seller);
        seller.bonus = seller.bonus.toFixed(2);

        let productsSoldArray = Object.entries(seller.products_sold);
        productsSoldArray = productsSoldArray.map(([sku, quantity]) => ({ sku , quantity }));
        productsSoldArray.sort((a,b) => {
            if (a.quantity > b.quantity){
            return -1;
            }
            if (a.quantity < b.quantity){
            return 1;
            }
            return 0;
});

        seller.top_products = productsSoldArray.slice(0,10) // Формируем топ-10 товаров
});

    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellerStats.map(seller => ({
        seller_id: seller.id,// Строка, идентификатор продавца
        name: seller.name,// Строка, имя продавца
        revenue: seller.revenue.toFixed(2),// Число с двумя знаками после точки, выручка продавца
        profit: seller.profit.toFixed(2),// Число с двумя знаками после точки, прибыль продавца
        sales_count: seller.sales_count,// Целое число, количество продаж продавца
        top_products: seller.top_products,// Массив объектов вида: { "sku": "SKU_008","quantity": 10}, топ-10 товаров продавца
        bonus: seller.bonus,// Число с двумя знаками после точки, бонус продавца
}));
}