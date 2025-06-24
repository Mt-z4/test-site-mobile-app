<?php
// Database connection configuration
class Database {
    private $host = "localhost";
    private $db_name = "granado_db";
    private $username = "root";
    private $password = "";
    private $conn = null;

    // Get database connection
    public function getConnection() {
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->exec("set names utf8");
        } catch(PDOException $e) {
            // Log error but don't expose details
            error_log("Connection Error: " . $e->getMessage());
            return null;
        }
        return $this->conn;
    }

    // For this demo, we'll use a JSON file instead of a database
    public function getProductsFromJson() {
        $json_file = __DIR__ . "/../../data/produtos.json";
        
        if (file_exists($json_file)) {
            try {
                $json_data = file_get_contents($json_file);
                return json_decode($json_data, true);
            } catch (Exception $e) {
                error_log("Error reading JSON file: " . $e->getMessage());
                return null;
            }
        }
        return null;
    }

    // Save contact form submissions to JSON
    public function saveContactSubmission($data) {
        $submissions_file = __DIR__ . "/../../data/contact_submissions.json";
        
        try {
            // Create submissions array
            $submissions = [];
            
            // If file exists, get current submissions
            if (file_exists($submissions_file)) {
                $current_data = file_get_contents($submissions_file);
                $submissions = json_decode($current_data, true) ?: [];
            }
            
            // Add new submission with timestamp
            $data['timestamp'] = date('Y-m-d H:i:s');
            $submissions[] = $data;
            
            // Save back to file
            file_put_contents($submissions_file, json_encode($submissions, JSON_PRETTY_PRINT));
            return true;
        } catch (Exception $e) {
            error_log("Error saving contact submission: " . $e->getMessage());
            return false;
        }
    }

    // Save order to JSON
    public function saveOrder($order_data) {
        $orders_file = __DIR__ . "/../../data/orders.json";
        
        try {
            // Create orders array
            $orders = [];
            
            // If file exists, get current orders
            if (file_exists($orders_file)) {
                $current_data = file_get_contents($orders_file);
                $orders = json_decode($current_data, true) ?: [];
            }
            
            // Add new order with timestamp and order ID
            $order_data['timestamp'] = date('Y-m-d H:i:s');
            $order_data['order_id'] = uniqid('ORD-');
            $orders[] = $order_data;
            
            // Save back to file
            file_put_contents($orders_file, json_encode($orders, JSON_PRETTY_PRINT));
            return $order_data['order_id'];
        } catch (Exception $e) {
            error_log("Error saving order: " . $e->getMessage());
            return false;
        }
    }
}

// Helper function to sanitize input
function sanitize_input($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

// Helper function to validate email
function validate_email($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

// Helper function to send response
function send_json_response($success, $message, $data = null) {
    header('Content-Type: application/json');
    $response = [
        'success' => $success,
        'message' => $message
    ];
    if ($data !== null) {
        $response['data'] = $data;
    }
    echo json_encode($response);
    exit;
}
?>
