<?php
require_once 'conexao.php';

// Set headers for CORS and JSON response
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Initialize cart if it doesn't exist
if (!isset($_SESSION['cart'])) {
    $_SESSION['cart'] = [];
}

try {
    // Get request method
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'GET':
            // Return cart contents
            $cart_items = $_SESSION['cart'];
            $total = calculateCartTotal($cart_items);
            
            send_json_response(true, 'Carrinho recuperado com sucesso', [
                'items' => $cart_items,
                'total' => $total,
                'item_count' => count($cart_items)
            ]);
            break;

        case 'POST':
            // Get POST data
            $json = file_get_contents('php://input');
            $data = json_decode($json, true);

            if (!$data) {
                send_json_response(false, 'Dados inválidos');
            }

            // Check if it's an update operation
            if (isset($data['action'])) {
                switch ($data['action']) {
                    case 'update':
                        if (!isset($data['product_id']) || !isset($data['quantity'])) {
                            send_json_response(false, 'Dados incompletos');
                        }

                        updateCartItem($data['product_id'], $data['quantity']);
                        break;

                    case 'clear':
                        clearCart();
                        break;

                    case 'checkout':
                        processCheckout($data);
                        break;
                }
            } else {
                // Add item to cart
                if (!isset($data['product_id']) || !isset($data['quantity'])) {
                    send_json_response(false, 'Dados incompletos');
                }

                addToCart($data['product_id'], $data['quantity']);
            }
            break;

        case 'DELETE':
            // Remove item from cart
            $json = file_get_contents('php://input');
            $data = json_decode($json, true);

            if (!isset($data['product_id'])) {
                send_json_response(false, 'ID do produto não fornecido');
            }

            removeFromCart($data['product_id']);
            break;

        default:
            send_json_response(false, 'Método não permitido');
    }

} catch (Exception $e) {
    error_log("Error in cart: " . $e->getMessage());
    send_json_response(false, 'Erro ao processar sua solicitação');
}

// Helper Functions

function addToCart($product_id, $quantity) {
    $database = new Database();
    $product = getProductDetails($product_id);

    if (!$product) {
        send_json_response(false, 'Produto não encontrado');
    }

    // Check if product already exists in cart
    $found = false;
    foreach ($_SESSION['cart'] as &$item) {
        if ($item['product_id'] == $product_id) {
            $item['quantity'] += $quantity;
            $found = true;
            break;
        }
    }

    // If product not in cart, add it
    if (!$found) {
        $_SESSION['cart'][] = [
            'product_id' => $product_id,
            'name' => $product['name'],
            'price' => $product['price'],
            'quantity' => $quantity,
            'image' => $product['image']
        ];
    }

    $total = calculateCartTotal($_SESSION['cart']);
    send_json_response(true, 'Produto adicionado ao carrinho', [
        'items' => $_SESSION['cart'],
        'total' => $total,
        'item_count' => count($_SESSION['cart'])
    ]);
}

function updateCartItem($product_id, $quantity) {
    foreach ($_SESSION['cart'] as &$item) {
        if ($item['product_id'] == $product_id) {
            if ($quantity <= 0) {
                removeFromCart($product_id);
                return;
            }
            $item['quantity'] = $quantity;
            break;
        }
    }

    $total = calculateCartTotal($_SESSION['cart']);
    send_json_response(true, 'Carrinho atualizado', [
        'items' => $_SESSION['cart'],
        'total' => $total,
        'item_count' => count($_SESSION['cart'])
    ]);
}

function removeFromCart($product_id) {
    $_SESSION['cart'] = array_filter($_SESSION['cart'], function($item) use ($product_id) {
        return $item['product_id'] != $product_id;
    });

    $total = calculateCartTotal($_SESSION['cart']);
    send_json_response(true, 'Produto removido do carrinho', [
        'items' => array_values($_SESSION['cart']), // Reset array keys
        'total' => $total,
        'item_count' => count($_SESSION['cart'])
    ]);
}

function clearCart() {
    $_SESSION['cart'] = [];
    send_json_response(true, 'Carrinho esvaziado', [
        'items' => [],
        'total' => 0,
        'item_count' => 0
    ]);
}

function calculateCartTotal($cart_items) {
    $total = 0;
    foreach ($cart_items as $item) {
        $total += $item['price'] * $item['quantity'];
    }
    return number_format($total, 2, '.', '');
}

function getProductDetails($product_id) {
    $database = new Database();
    $products = $database->getProductsFromJson();

    if (!$products) {
        return null;
    }

    foreach ($products as $product) {
        if ($product['id'] == $product_id) {
            return $product;
        }
    }

    return null;
}

function processCheckout($data) {
    if (empty($_SESSION['cart'])) {
        send_json_response(false, 'Carrinho vazio');
    }

    // Validate checkout data
    if (!isset($data['customer']) || 
        !isset($data['shipping_address']) || 
        !isset($data['payment_method'])) {
        send_json_response(false, 'Dados de checkout incompletos');
    }

    $order_data = [
        'customer' => $data['customer'],
        'shipping_address' => $data['shipping_address'],
        'payment_method' => $data['payment_method'],
        'items' => $_SESSION['cart'],
        'total' => calculateCartTotal($_SESSION['cart'])
    ];

    // Save order
    $database = new Database();
    $order_id = $database->saveOrder($order_data);

    if (!$order_id) {
        send_json_response(false, 'Erro ao processar pedido');
    }

    // Clear cart after successful checkout
    clearCart();

    send_json_response(true, 'Pedido realizado com sucesso', [
        'order_id' => $order_id
    ]);
}
?>
