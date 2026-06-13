class CartItem{
  final String id;
  final String name;
  final double price;
  int quantity;

  CartItem({required this.id,required this.name, required this.price, required this.quantity});



  double get totalPrice => price * quantity;

  
}


class Cart {
  final List<CartItem> _items = [];


  List<CartItem> get items => List.unmodifiable(_items);

  double calculateTotal (){
    return _items.fold(0.0,(previous,item) => previous + item.totalPrice);
  }

  void addItem(CartItem cartItem){
    final existingIndex = _items.indexWhere((item) => item.id == cartItem.id);

    if(existingIndex >= 0){
      _items[existingIndex].quantity = cartItem.quantity;
    }else{
      _items.add(cartItem);
    }
  }

  void printCartSummary(){
    if(_items.isEmpty){
      print("Giỏ hàng đang trống");
      return;
    }

    for(var item in _items){
      print("${item.name} - SL: ${item.quantity} - Giá: ${item.price} - Thành tiền: ${item.totalPrice}");
    }

    print('Tổng thanh toán: ${calculateTotal()}');
  }

  bool updateCart(String itemId, int quantity){
    try{
      final item = _items.firstWhere((item) => item.id == itemId);
      item.quantity = quantity;
      return true;
    }catch(e){
      return false;
    }
  }

  bool removeItem(String itemId){
    final originalLength = _items.length;
    _items.removeWhere((item) => item.id == itemId);
    if(_items.length < originalLength){
      return true;
    }

    return false;
  }
}

void main(){
  final cart = Cart();

  cart.addItem(CartItem(id: "1", name: "Áo thun", price: 10000, quantity: 4));
    cart.addItem(CartItem(id: "1", name: "Áo đỏ", price: 10000, quantity: 8));

  cart.printCartSummary();

  // cart.removeItem('1');
  final items = cart.items;

  for(var item in items){
    print(item.toString());
  }
}