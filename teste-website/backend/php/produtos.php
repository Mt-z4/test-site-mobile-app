<?php
require_once 'conexao.php';

// Set headers for CORS and JSON response
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_json_response(false, 'Método não permitido');
}

try {
    $database = new Database();
    
    // Get query parameters
    $category = isset($_GET['category']) ? sanitize_input($_GET['category']) : null;
    $sort = isset($_GET['sort']) ? sanitize_input($_GET['sort']) : null;
    $search = isset($_GET['search']) ? sanitize_input($_GET['search']) : null;

    // Get products from JSON file
    $products = $database->getProductsFromJson();

    if ($products === null) {
        send_json_response(false, 'Erro ao carregar produtos');
    }

    // Filter by category if specified
    if ($category) {
        $products = array_filter($products, function($product) use ($category) {
            return strtolower($product['category']) === strtolower($category);
        });
    }

    // Filter by search term if specified
    if ($search) {
        $products = array_filter($products, function($product) use ($search) {
            $search_lower = strtolower($search);
            return strpos(strtolower($product['name']), $search_lower) !== false ||
                   strpos(strtolower($product['description']), $search_lower) !== false;
        });
    }

    // Sort products if specified
    if ($sort) {
        switch ($sort) {
            case 'price-asc':
                usort($products, function($a, $b) {
                    return $a['price'] <=> $b['price'];
                });
                break;
            case 'price-desc':
                usort($products, function($a, $b) {
                    return $b['price'] <=> $a['price'];
                });
                break;
            case 'name-asc':
                usort($products, function($a, $b) {
                    return strcmp($a['name'], $b['name']);
                });
                break;
            case 'name-desc':
                usort($products, function($a, $b) {
                    return strcmp($b['name'], $a['name']);
                });
                break;
            // Add more sorting options as needed
        }
    }

    // Get pagination parameters
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $per_page = isset($_GET['per_page']) ? (int)$_GET['per_page'] : 12;

    // Calculate pagination
    $total_products = count($products);
    $total_pages = ceil($total_products / $per_page);
    $offset = ($page - 1) * $per_page;

    // Slice array for pagination
    $products = array_slice($products, $offset, $per_page);

    // Prepare response
    $response = [
        'success' => true,
        'data' => [
            'products' => array_values($products), // Reset array keys
            'pagination' => [
                'current_page' => $page,
                'per_page' => $per_page,
                'total_pages' => $total_pages,
                'total_products' => $total_products
            ]
        ]
    ];

    // Send response
    echo json_encode($response);

} catch (Exception $e) {
    error_log("Error in products: " . $e->getMessage());
    send_json_response(false, 'Erro ao processar sua solicitação');
}

// Helper function to get product by ID
function getProductById($id) {
    $database = new Database();
    $products = $database->getProductsFromJson();
    
    if ($products === null) {
        return null;
    }

    foreach ($products as $product) {
        if ($product['id'] == $id) {
            return $product;
        }
    }

    return null;
}

// If specific product ID is requested
if (isset($_GET['id'])) {
    $product_id = sanitize_input($_GET['id']);
    $product = getProductById($product_id);
    
    if ($product) {
        send_json_response(true, 'Produto encontrado', $product);
    } else {
        send_json_response(false, 'Produto não encontrado');
    }
}
?>
