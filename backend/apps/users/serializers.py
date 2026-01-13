from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework.authtoken.models import Token

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user profile"""

    has_github_token = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'github_username', 'has_github_token', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class SignupSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""

    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True, label="Confirm Password")

    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'password2']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password']
        )
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login"""

    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                raise serializers.ValidationError("Invalid credentials")

            if not user.check_password(password):
                raise serializers.ValidationError("Invalid credentials")

            if not user.is_active:
                raise serializers.ValidationError("User account is disabled")

            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError("Must include 'email' and 'password'")


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile"""

    github_token = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'github_username', 'github_token']

    def update(self, instance, validated_data):
        github_token = validated_data.pop('github_token', None)

        # Update basic fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Handle GitHub token encryption
        if github_token is not None:
            if github_token:
                instance.set_github_token(github_token)
            else:
                instance.github_token = None

        instance.save()
        return instance


class GitHubPATValidationSerializer(serializers.Serializer):
    """Serializer for validating GitHub Personal Access Token"""

    token = serializers.CharField(required=True, write_only=True)
    is_valid = serializers.BooleanField(read_only=True)
    username = serializers.CharField(read_only=True, required=False)
    message = serializers.CharField(read_only=True, required=False)
