import Time "mo:core/Time";
import List "mo:core/List";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Order "mo:core/Order";

import MixinStorage "blob-storage/Mixin";

actor {
  include MixinStorage();

  // Data Types
  type BookFormat = { #kindle : Text; #paperback : Text };
  type Book = {
    id : Text;
    title : Text;
    description : Text;
    genre : Text;
    coverImageUrl : Text;
    formats : [BookFormat];
    audiobookLink : ?Text;
    featured : Bool;
  };

  type BlogPost = {
    id : Text;
    title : Text;
    category : Text;
    content : Text;
    excerpt : Text;
    coverImageUrl : Text;
    publishedAt : Int;
  };

  type Review = {
    bookId : Text;
    reviewerName : Text;
    email : Text;
    rating : Nat;
    comment : Text;
  };

  type OrderItem = {
    productId : Text;
    name : Text;
    quantity : Nat;
    price : Nat;
    currency : Text;
  };

  type Order = {
    id : Text;
    customerName : Text;
    customerEmail : Text;
    customerPhone : Text;
    items : [OrderItem];
    totalAmount : Nat;
    currency : Text;
    status : Text;
    createdAt : Int;
    razorpayPaymentId : Text;
    notes : Text;
  };

  type Coupon = {
    code : Text;
    discountType : Text;
    discountValue : Nat;
    maxUsages : Nat;
    usageCount : Nat;
    expiryDate : Int;
    isActive : Bool;
    currency : Text;
  };

  type Audiobook = {
    id : Text;
    name : Text;
    description : Text;
    priceINR : Nat;
    priceUSD : Nat;
    duration : Text;
    narrator : Text;
    coverEmoji : Text;
    razorpayUrlINR : Text;
    razorpayUrlUSD : Text;
    isActive : Bool;
  };

  type MerchItem = {
    id : Text;
    name : Text;
    description : Text;
    priceINR : Nat;
    priceUSD : Nat;
    category : Text;
    coverEmoji : Text;
    razorpayUrl : Text;
    isActive : Bool;
  };

  type Setting = {
    key : Text;
    value : Text;
  };

  // Safe upsert helpers: remove existing key first so add() never traps
  func upsertBook(key : Text, value : Book) {
    books.remove(key);
    books.add(key, value);
  };

  func upsertBlogPost(key : Text, value : BlogPost) {
    blogPosts.remove(key);
    blogPosts.add(key, value);
  };

  func upsertReviews(key : Text, value : List.List<Review>) {
    reviews.remove(key);
    reviews.add(key, value);
  };

  func upsertOrder(key : Text, value : Order) {
    orders.remove(key);
    orders.add(key, value);
  };

  func upsertCoupon(key : Text, value : Coupon) {
    coupons.remove(key);
    coupons.add(key, value);
  };

  func upsertAudiobook(key : Text, value : Audiobook) {
    audiobooks.remove(key);
    audiobooks.add(key, value);
  };

  func upsertMerchItem(key : Text, value : MerchItem) {
    merchItems.remove(key);
    merchItems.add(key, value);
  };

  func upsertSetting(key : Text, value : Setting) {
    settings.remove(key);
    settings.add(key, value);
  };

  // Persistent Data Structures
  let books = Map.empty<Text, Book>();
  let blogPosts = Map.empty<Text, BlogPost>();
  let reviews = Map.empty<Text, List.List<Review>>();
  var subscribers = List.empty<Text>();
  var authorBio = "O. Chiddarwar is a passionate author...";

  let orders = Map.empty<Text, Order>();
  let coupons = Map.empty<Text, Coupon>();
  let audiobooks = Map.empty<Text, Audiobook>();
  let merchItems = Map.empty<Text, MerchItem>();
  let settings = Map.empty<Text, Setting>();

  // Book Management
  public query func getBooks() : async [Book] {
    books.values().toArray();
  };

  public query func getBook(id : Text) : async Book {
    switch (books.get(id)) {
      case (null) { Runtime.trap("Book not found") };
      case (?book) { book };
    };
  };

  public shared ({ caller }) func addBook(book : Book) : async () {
    upsertBook(book.id, book);
  };

  public shared ({ caller }) func updateBook(book : Book) : async () {
    upsertBook(book.id, book);
  };

  public shared ({ caller }) func deleteBook(id : Text) : async () {
    books.remove(id);
  };

  // Blog Management
  public query func getBlogPosts() : async [BlogPost] {
    blogPosts.values().toArray();
  };

  public query func getBlogPost(id : Text) : async BlogPost {
    switch (blogPosts.get(id)) {
      case (null) { Runtime.trap("Post not found") };
      case (?post) { post };
    };
  };

  public shared ({ caller }) func addBlogPost(post : BlogPost) : async () {
    upsertBlogPost(post.id, post);
  };

  public shared ({ caller }) func updateBlogPost(post : BlogPost) : async () {
    upsertBlogPost(post.id, post);
  };

  public shared ({ caller }) func deleteBlogPost(id : Text) : async () {
    blogPosts.remove(id);
  };

  // Newsletter Subscribers
  public shared ({ caller }) func addSubscriber(email : Text) : async () {
    if (subscribers.contains(email)) {
      Runtime.trap("This email is already subscribed.");
    };
    subscribers.add(email);
  };

  public shared ({ caller }) func removeSubscriber(email : Text) : async () {
    subscribers.retain(func (sub) { sub != email });
  };

  public query ({ caller }) func getSubscribers() : async [Text] {
    subscribers.toArray();
  };

  // Author Bio
  public shared ({ caller }) func updateAuthorBio(bio : Text) : async () {
    authorBio := bio;
  };

  public query func getAuthorBio() : async Text {
    authorBio;
  };

  // Book Reviews
  public shared ({ caller }) func addReview(review : Review) : async () {
    let existingReviews = switch (reviews.get(review.bookId)) {
      case (null) { List.empty<Review>() };
      case (?list) { list };
    };
    existingReviews.add(review);
    upsertReviews(review.bookId, existingReviews);
  };

  public query func getReviews(bookId : Text) : async [Review] {
    switch (reviews.get(bookId)) {
      case (null) { [] };
      case (?list) { list.toArray() };
    };
  };

  // Order Management
  public shared ({ caller }) func createOrder(order : Order) : async () {
    upsertOrder(order.id, order);
  };

  public query func getOrders() : async [Order] {
    orders.values().toArray();
  };

  public query func getOrder(id : Text) : async ?Order {
    orders.get(id);
  };

  public shared ({ caller }) func updateOrderStatus(id : Text, status : Text) : async () {
    let order = switch (orders.get(id)) {
      case (null) { Runtime.trap("Order not found") };
      case (?o) { o };
    };
    let updatedOrder = { order with status };
    upsertOrder(id, updatedOrder);
  };

  public shared ({ caller }) func deleteOrder(id : Text) : async () {
    orders.remove(id);
  };

  // Coupon Codes
  public shared ({ caller }) func createCoupon(coupon : Coupon) : async () {
    upsertCoupon(coupon.code, coupon);
  };

  public query func getCoupons() : async [Coupon] {
    coupons.values().toArray();
  };

  public query func getCoupon(code : Text) : async ?Coupon {
    coupons.get(code);
  };

  public shared ({ caller }) func deleteCoupon(code : Text) : async () {
    coupons.remove(code);
  };

  public shared ({ caller }) func incrementCouponUsage(code : Text) : async () {
    let coupon = switch (coupons.get(code)) {
      case (null) { Runtime.trap("Coupon not found") };
      case (?c) { c };
    };
    let updatedCoupon = {
      coupon with
      usageCount = coupon.usageCount + 1;
    };
    upsertCoupon(code, updatedCoupon);
  };

  public query func validateCoupon(code : Text) : async ?Coupon {
    switch (coupons.get(code)) {
      case (null) { null };
      case (?coupon) {
        if (not coupon.isActive) { return null };
        if (coupon.expiryDate < Time.now()) { return null };
        if (coupon.usageCount >= coupon.maxUsages) { return null };
        ?coupon;
      };
    };
  };

  // Audiobook Management
  public shared ({ caller }) func createAudiobook(audiobook : Audiobook) : async () {
    upsertAudiobook(audiobook.id, audiobook);
  };

  public query func getAudiobooks() : async [Audiobook] {
    audiobooks.values().toArray();
  };

  public query func getAudiobook(id : Text) : async ?Audiobook {
    audiobooks.get(id);
  };

  public shared ({ caller }) func updateAudiobook(audiobook : Audiobook) : async () {
    upsertAudiobook(audiobook.id, audiobook);
  };

  public shared ({ caller }) func deleteAudiobook(id : Text) : async () {
    audiobooks.remove(id);
  };

  // Merch Management
  public shared ({ caller }) func createMerchItem(merchItem : MerchItem) : async () {
    upsertMerchItem(merchItem.id, merchItem);
  };

  public query func getMerchItems() : async [MerchItem] {
    merchItems.values().toArray();
  };

  public query func getMerchItem(id : Text) : async ?MerchItem {
    merchItems.get(id);
  };

  public shared ({ caller }) func updateMerchItem(merchItem : MerchItem) : async () {
    upsertMerchItem(merchItem.id, merchItem);
  };

  public shared ({ caller }) func deleteMerchItem(id : Text) : async () {
    merchItems.remove(id);
  };

  // Site Settings
  public query func getSetting(key : Text) : async ?Setting {
    settings.get(key);
  };

  public shared ({ caller }) func updateSetting(setting : Setting) : async () {
    upsertSetting(setting.key, setting);
  };

  public query func getAllSettings() : async [Setting] {
    settings.values().toArray();
  };
};
