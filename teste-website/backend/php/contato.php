<?php
require_once 'conexao.php';

// Set headers for CORS and JSON response
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json_response(false, 'Método não permitido');
}

try {
    // Get POST data
    $data = [
        'name' => isset($_POST['name']) ? sanitize_input($_POST['name']) : '',
        'email' => isset($_POST['email']) ? sanitize_input($_POST['email']) : '',
        'subject' => isset($_POST['subject']) ? sanitize_input($_POST['subject']) : '',
        'message' => isset($_POST['message']) ? sanitize_input($_POST['message']) : ''
    ];

    // Validate required fields
    if (empty($data['name']) || empty($data['email']) || empty($data['subject']) || empty($data['message'])) {
        send_json_response(false, 'Todos os campos são obrigatórios');
    }

    // Validate email
    if (!validate_email($data['email'])) {
        send_json_response(false, 'Email inválido');
    }

    // Initialize database connection
    $database = new Database();

    // Save submission
    if ($database->saveContactSubmission($data)) {
        // Send email notification (in production)
        // mail('admin@granado.com', 'Nova mensagem de contato', print_r($data, true));
        
        send_json_response(true, 'Mensagem enviada com sucesso');
    } else {
        send_json_response(false, 'Erro ao salvar mensagem');
    }

} catch (Exception $e) {
    error_log("Error in contact form: " . $e->getMessage());
    send_json_response(false, 'Erro ao processar sua solicitação');
}
?>
