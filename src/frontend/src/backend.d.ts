import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface BlogPost {
    id: string;
    coverImageUrl: string;
    title: string;
    content: string;
    publishedAt: bigint;
    excerpt: string;
    category: string;
}
export interface Coupon {
    discountValue: bigint;
    expiryDate: bigint;
    code: string;
    discountType: string;
    usageCount: bigint;
    isActive: boolean;
    maxUsages: bigint;
    currency: string;
}
export interface ShippingAddress {
    country: string;
    city: string;
    fullName: string;
    line1: string;
    line2: string;
    state: string;
    phone: string;
    pincode: string;
}
export interface Book {
    id: string;
    coverImageUrl: string;
    title: string;
    featured: boolean;
    audiobookLink?: string;
    description: string;
    genre: string;
    formats: Array<BookFormat>;
}
export interface OrderItem {
    name: string;
    productId: string;
    currency: string;
    quantity: bigint;
    price: bigint;
}
export interface Order {
    id: string;
    razorpayPaymentId: string;
    customerName: string;
    status: string;
    customerPhone: string;
    createdAt: bigint;
    totalAmount: bigint;
    currency: string;
    notes: string;
    shippingAddress?: ShippingAddress;
    customerId?: string;
    items: Array<OrderItem>;
    customerEmail: string;
}
export interface MerchItem {
    id: string;
    razorpayUrl: string;
    coverEmoji: string;
    name: string;
    description: string;
    isActive: boolean;
    category: string;
    priceINR: bigint;
    priceUSD: bigint;
}
export interface Audiobook {
    id: string;
    duration: string;
    coverEmoji: string;
    name: string;
    description: string;
    isActive: boolean;
    razorpayUrlINR: string;
    razorpayUrlUSD: string;
    priceINR: bigint;
    priceUSD: bigint;
    narrator: string;
}
export type BookFormat = {
    __kind__: "paperback";
    paperback: string;
} | {
    __kind__: "kindle";
    kindle: string;
};
export interface CustomerAccount {
    id: string;
    name: string;
    createdAt: bigint;
    email: string;
    passwordHash: string;
}
export interface Setting {
    key: string;
    value: string;
}
export interface CustomerAddress {
    id: string;
    country: string;
    city: string;
    fullName: string;
    line1: string;
    line2: string;
    state: string;
    addressLabel: string;
    isDefault: boolean;
    customerId: string;
    phone: string;
    pincode: string;
}
export interface Review {
    bookId: string;
    reviewerName: string;
    email: string;
    comment: string;
    rating: bigint;
}
export interface backendInterface {
    addBlogPost(post: BlogPost): Promise<void>;
    addBook(book: Book): Promise<void>;
    addCustomerAddress(address: CustomerAddress): Promise<void>;
    addReview(review: Review): Promise<void>;
    addSubscriber(email: string): Promise<void>;
    changeCustomerPassword(id: string, oldHash: string, newHash: string): Promise<boolean>;
    createAudiobook(audiobook: Audiobook): Promise<void>;
    createCoupon(coupon: Coupon): Promise<void>;
    createMerchItem(merchItem: MerchItem): Promise<void>;
    createOrder(order: Order): Promise<void>;
    deleteAudiobook(id: string): Promise<void>;
    deleteBlogPost(id: string): Promise<void>;
    deleteBook(id: string): Promise<void>;
    deleteCoupon(code: string): Promise<void>;
    deleteCustomerAddress(id: string): Promise<void>;
    deleteMerchItem(id: string): Promise<void>;
    deleteOrder(id: string): Promise<void>;
    getAllSettings(): Promise<Array<Setting>>;
    getAudiobook(id: string): Promise<Audiobook | null>;
    getAudiobooks(): Promise<Array<Audiobook>>;
    getAuthorBio(): Promise<string>;
    getBlogPost(id: string): Promise<BlogPost>;
    getBlogPosts(): Promise<Array<BlogPost>>;
    getBook(id: string): Promise<Book>;
    getBooks(): Promise<Array<Book>>;
    getCoupon(code: string): Promise<Coupon | null>;
    getCoupons(): Promise<Array<Coupon>>;
    getCustomer(id: string): Promise<CustomerAccount | null>;
    getCustomerAddresses(customerId: string): Promise<Array<CustomerAddress>>;
    getMerchItem(id: string): Promise<MerchItem | null>;
    getMerchItems(): Promise<Array<MerchItem>>;
    getOrder(id: string): Promise<Order | null>;
    getOrders(): Promise<Array<Order>>;
    getReviews(bookId: string): Promise<Array<Review>>;
    getSetting(key: string): Promise<Setting | null>;
    getSubscribers(): Promise<Array<string>>;
    incrementCouponUsage(code: string): Promise<void>;
    loginCustomer(email: string, passwordHash: string): Promise<CustomerAccount | null>;
    registerCustomer(name: string, email: string, passwordHash: string): Promise<string | null>;
    removeSubscriber(email: string): Promise<void>;
    setDefaultAddress(customerId: string, addressId: string): Promise<void>;
    updateAudiobook(audiobook: Audiobook): Promise<void>;
    updateAuthorBio(bio: string): Promise<void>;
    updateBlogPost(post: BlogPost): Promise<void>;
    updateBook(book: Book): Promise<void>;
    updateCustomer(account: CustomerAccount): Promise<void>;
    updateCustomerAddress(address: CustomerAddress): Promise<void>;
    updateMerchItem(merchItem: MerchItem): Promise<void>;
    updateOrderStatus(id: string, status: string): Promise<void>;
    updateSetting(setting: Setting): Promise<void>;
    validateCoupon(code: string): Promise<Coupon | null>;
}
