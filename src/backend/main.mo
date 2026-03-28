import Time "mo:core/Time";
import List "mo:core/List";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Order "mo:core/Order";

import MixinStorage "blob-storage/Mixin";

// Specify migration in with-clause

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

  module Book {
    public func compare(book1 : Book, book2 : Book) : Order.Order {
      Text.compare(book1.id, book2.id);
    };
  };

  module BlogPost {
    public func compare(blogPost1 : BlogPost, blogPost2 : BlogPost) : Order.Order {
      Text.compare(blogPost1.id, blogPost2.id);
    };
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
    books.values().toArray().sort();
  };

  public query func getBook(id : Text) : async Book {
    switch (books.get(id)) {
      case (null) { Runtime.trap("Book not found") };
      case (?book) { book };
    };
  };

  public shared ({ caller }) func addBook(book : Book) : async () {
    books.add(book.id, book);
  };

  public shared ({ caller }) func updateBook(book : Book) : async () {
    if (not books.containsKey(book.id)) {
      Runtime.trap("Book not found");
    };
    books.add(book.id, book);
  };

  public query ({ caller }) func deleteBook(id : Text) : async () {
    books.remove(id);
  };

  // Blog Management
  public query func getBlogPosts() : async [BlogPost] {
    blogPosts.values().toArray().sort();
  };

  public query func getBlogPost(id : Text) : async BlogPost {
    switch (blogPosts.get(id)) {
      case (null) { Runtime.trap("Post not found") };
      case (?post) { post };
    };
  };

  public shared ({ caller }) func addBlogPost(post : BlogPost) : async () {
    blogPosts.add(post.id, post);
  };

  public shared ({ caller }) func updateBlogPost(post : BlogPost) : async () {
    if (not blogPosts.containsKey(post.id)) {
      Runtime.trap("Post not found");
    };
    blogPosts.add(post.id, post);
  };

  public query ({ caller }) func deleteBlogPost(id : Text) : async () {
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
    reviews.add(review.bookId, existingReviews);
  };

  public query func getReviews(bookId : Text) : async [Review] {
    switch (reviews.get(bookId)) {
      case (null) { [] };
      case (?list) { list.toArray() };
    };
  };

  // Order Management
  public shared ({ caller }) func createOrder(order : Order) : async () {
    orders.add(order.id, order);
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
    orders.add(id, updatedOrder);
  };

  public shared ({ caller }) func deleteOrder(id : Text) : async () {
    orders.remove(id);
  };

  // Coupon Codes
  public shared ({ caller }) func createCoupon(coupon : Coupon) : async () {
    coupons.add(coupon.code, coupon);
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
    coupons.add(code, updatedCoupon);
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
    audiobooks.add(audiobook.id, audiobook);
  };

  public query func getAudiobooks() : async [Audiobook] {
    audiobooks.values().toArray();
  };

  public query func getAudiobook(id : Text) : async ?Audiobook {
    audiobooks.get(id);
  };

  public shared ({ caller }) func updateAudiobook(audiobook : Audiobook) : async () {
    if (not audiobooks.containsKey(audiobook.id)) {
      Runtime.trap("Audiobook not found");
    };
    audiobooks.add(audiobook.id, audiobook);
  };

  public shared ({ caller }) func deleteAudiobook(id : Text) : async () {
    audiobooks.remove(id);
  };

  // Merch Management
  public shared ({ caller }) func createMerchItem(merchItem : MerchItem) : async () {
    merchItems.add(merchItem.id, merchItem);
  };

  public query func getMerchItems() : async [MerchItem] {
    merchItems.values().toArray();
  };

  public query func getMerchItem(id : Text) : async ?MerchItem {
    merchItems.get(id);
  };

  public shared ({ caller }) func updateMerchItem(merchItem : MerchItem) : async () {
    if (not merchItems.containsKey(merchItem.id)) {
      Runtime.trap("Merch item not found");
    };
    merchItems.add(merchItem.id, merchItem);
  };

  public shared ({ caller }) func deleteMerchItem(id : Text) : async () {
    merchItems.remove(id);
  };

  // Site Settings
  public query func getSetting(key : Text) : async ?Setting {
    settings.get(key);
  };

  public shared ({ caller }) func updateSetting(setting : Setting) : async () {
    settings.add(setting.key, setting);
  };

  public query func getAllSettings() : async [Setting] {
    settings.values().toArray();
  };
};
